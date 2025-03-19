import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../../types';
import { findSqlFiles, readFile } from '../../utils/file-utils';
import * as logger from '../../utils/logger';

export const rlsChecker: Checker = {
  id: 'rls',
  name: 'Supabase RLS',
  description: 'Checks for missing or insecure Row Level Security policies',
  check: async (options: CheckOptions): Promise<CheckResult[]> => {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for RLS issues in ${directory}...`);
    
    try {
      // Find SQL files
      const sqlFiles = await findSqlFiles(directory);
      logger.debug(`Found ${sqlFiles.length} SQL files to scan`);
      
      if (sqlFiles.length === 0) {
        logger.debug('No SQL files found');
        return [{
          id: 'supabase-rls',
          name: 'Supabase RLS Policy Check',
          description: 'Check for missing or insecure Row Level Security policies',
          severity: Severity.High,
          passed: true,
          details: 'No SQL files found to scan'
        }];
      }
      
      // Track tables and their RLS status
      const tables: Record<string, { hasRls: boolean, file: string, line?: number, content?: string }> = {};
      const publicPolicies: Array<{ table: string, file: string, line: number, policy: string }> = [];
      
      // Loop through SQL files
      for (const file of sqlFiles) {
        const relativeFile = path.relative(directory, file);
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for RLS issues`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue; // Skip if file couldn't be read
        
        const lines = content.split('\n');
        
        // Look for table definitions and RLS
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase().trim();
          
          // Check for table creation
          const tableMatch = line.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_"]+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1].replace(/"/g, '').trim();
            tables[tableName] = { hasRls: false, file: relativeFile, line: i + 1, content };
          }
          
          // Check for RLS enablement
          const rlsMatch = line.match(/alter\s+table\s+([a-z0-9_"]+)\s+enable\s+row\s+level\s+security/i);
          if (rlsMatch) {
            const tableName = rlsMatch[1].replace(/"/g, '').trim();
            if (tables[tableName]) {
              tables[tableName].hasRls = true;
            } else {
              tables[tableName] = { hasRls: true, file: relativeFile, line: i + 1, content };
            }
          }
          
          // Check for public policies
          if (line.includes('create policy') && (
            line.includes('using (true)') || 
            line.includes('using true') || 
            line.includes('"public"') || 
            line.includes("'public'")
          )) {
            // Extract table name from policy
            const policyMatch = line.match(/create\s+policy\s+[\w"']+\s+on\s+([a-z0-9_"]+)/i);
            if (policyMatch) {
              const tableName = policyMatch[1].replace(/"/g, '').trim();
              publicPolicies.push({
                table: tableName,
                file: relativeFile,
                line: i + 1,
                policy: line
              });
            }
          }
        }
      }
      
      // Report tables without RLS
      for (const [tableName, info] of Object.entries(tables)) {
        if (!info.hasRls) {
          results.push({
            id: 'supabase-rls-disabled',
            name: 'Missing Row Level Security',
            description: `Table "${tableName}" does not have Row Level Security enabled`,
            severity: Severity.High,
            passed: false,
            file: info.file,
            location: {
              file: info.file,
              line: info.line || 0,
              code: info.content || ''
            },
            details: `Table "${tableName}" in ${info.file} does not have RLS enabled, allowing unrestricted access`,
            recommendation: `Enable RLS with: ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`
          });
        }
      }
      
      // Report public policies
      for (const policy of publicPolicies) {
        results.push({
          id: 'supabase-public-policy',
          name: 'Public Access Policy',
          description: `Table "${policy.table}" has a policy that grants public access`,
          severity: Severity.High,
          passed: false,
          file: policy.file,
          location: {
            file: policy.file,
            line: policy.line || 0,
            code: policy.policy || ''
          },
          details: `Table "${policy.table}" has a policy that grants public access in ${policy.file}:${policy.line}`,
          recommendation: 'Replace "using (true)" with a proper access condition like "using (auth.uid() = user_id)"'
        });
      }
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'supabase-rls',
          name: 'Supabase RLS Policy Check',
          description: 'Check for missing or insecure Row Level Security policies',
          severity: Severity.High,
          passed: true,
          details: 'All tables have RLS enabled with proper access policies'
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during Supabase RLS check: ${err}`);
      
      return [{
        id: 'supabase-rls-error',
        name: 'Supabase RLS Check Error',
        description: 'An error occurred during the Supabase RLS check',
        severity: Severity.High,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
};
