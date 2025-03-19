import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../../types';
import { findEnvFiles, readFile } from '../../utils/file-utils';
import * as logger from '../../utils/logger';

const SENSITIVE_ENV_PATTERNS = [
  /NEXT_PUBLIC_SUPABASE_KEY/,
  /NEXT_PUBLIC_OPENAI/,
  /NEXT_PUBLIC_ANTHROPIC/,
  /NEXT_PUBLIC_.+_(KEY|SECRET|PASSWORD|TOKEN)/i
];

export const nextPublicEnvChecker: Checker = {
  id: 'next-public-env-checker',
  name: 'Next.js Public Environment Variable Check',
  description: 'Checks for sensitive data in NEXT_PUBLIC_ environment variables',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for exposed Next.js public environment variables in ${directory}...`);
    
    try {
      // Find all env files
      const envFiles = await findEnvFiles(directory);
      logger.debug(`Found ${envFiles.length} environment files to scan`);
      
      // No env files found
      if (envFiles.length === 0) {
        logger.debug('No Next.js environment files found');
        return [{
          id: 'next-public-env',
          name: 'Next.js Public Environment Variables',
          description: 'Check for sensitive data in NEXT_PUBLIC_ variables',
          severity: Severity.Medium,
          passed: true,
          details: 'No Next.js environment files found to scan'
        }];
      }
      
      // Loop through env files
      for (const file of envFiles) {
        const relativeFile = path.relative(directory, file);
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for sensitive public env variables`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue; // Skip if file couldn't be read
        
        const lines = content.split('\n');
        
        // Check each line for sensitive patterns
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith('#')) continue;
          
          for (const pattern of SENSITIVE_ENV_PATTERNS) {
            if (pattern.test(line)) {
              results.push({
                id: 'next-public-env-exposed',
                name: 'Exposed Sensitive Data in NEXT_PUBLIC_ Variable',
                description: 'Found sensitive data exposed in a NEXT_PUBLIC_ environment variable',
                severity: Severity.Critical,
                passed: false,
                file: relativeFile,
                location: {
                  file: relativeFile,
                  line: i + 1,
                  code: line
                },
                details: `Public environment variable contains sensitive data in ${path.basename(file)}:${i + 1}`,
                recommendation: 'Remove the NEXT_PUBLIC_ prefix and use server-side access only, or use a different approach like API routes to access this data'
              });
            }
          }
        }
      }
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'next-public-env',
          name: 'Next.js Public Environment Variables',
          description: 'Check for sensitive data in NEXT_PUBLIC_ variables',
          severity: Severity.Medium,
          passed: true,
          details: 'No sensitive data found in NEXT_PUBLIC_ environment variables'
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during Next.js public env check: ${err}`);
      
      return [{
        id: 'next-public-env-error',
        name: 'Next.js Public Environment Check Error',
        description: 'An error occurred during the Next.js public environment check',
        severity: Severity.Medium,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
};
