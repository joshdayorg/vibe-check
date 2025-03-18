import * as path from 'path';
import { CheckResult, Checker, CheckOptions } from '../types';
import { getFiles, readFile, isTextFile, getFileContentWithLineNumbers } from '../utils/file-utils';
import * as logger from '../utils/logger';

// Patterns that might indicate API keys
const API_KEY_PATTERNS = [
  // Generic API keys
  /['"]?(?:api[_-]?key|apikey|api[_-]?secret|apisecret)['"]?\s*[=:]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/, 
  
  // AWS keys
  /['"]?(?:aws[_-]?access[_-]?key[_-]?id)['"]?\s*[=:]\s*['"]([A-Z0-9]{20})['"]/, 
  /['"]?(?:aws[_-]?secret[_-]?access[_-]?key)['"]?\s*[=:]\s*['"]([A-Za-z0-9\/+]{40})['"]/, 
  
  // Google API keys
  /['"]?(?:google[_-]?api[_-]?key|google[_-]?maps[_-]?api[_-]?key)['"]?\s*[=:]\s*['"]AIza([a-zA-Z0-9_-]{35})['"]/, 
  
  // Firebase
  /['"]?(?:firebase[_-]?api[_-]?key)['"]?\s*[=:]\s*['"]AIza([a-zA-Z0-9_-]{35})['"]/, 
  
  // Stripe
  /['"]?(?:stripe[_-]?(?:publishable|secret)[_-]?key)['"]?\s*[=:]\s*['"](?:pk|sk)_(?:test|live)_([a-zA-Z0-9]{24})['"]/, 
  
  // GitHub
  /['"]?(?:github[_-]?(?:access|api)[_-]?token)['"]?\s*[=:]\s*['"](?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}['"]/, 
  
  // Slack
  /['"]?(?:slack[_-]?(?:api|bot)[_-]?token)['"]?\s*[=:]\s*['"]xox[baprs]-([a-zA-Z0-9]+-[a-zA-Z0-9]+)['"]/, 
  
  // Mailchimp
  /['"]?(?:mailchimp[_-]?api[_-]?key)['"]?\s*[=:]\s*['"]([a-f0-9]{32}-us[0-9]{1,2})['"]/, 
  
  // Twitter
  /['"]?(?:twitter[_-]?(?:api|consumer)[_-]?(?:key|secret))['"]?\s*[=:]\s*['"]([a-zA-Z0-9]{25,})['"]/, 
];

// File patterns to check
const FILE_PATTERNS = [
  '**/*.js',
  '**/*.jsx',
  '**/*.ts',
  '**/*.tsx',
  '**/*.json',
  '**/*.yaml',
  '**/*.yml',
  '**/*.env*',
  '**/*.config.js',
  '**/*.config.ts',
];

// Safe files/paths (typically examples or tests)
const SAFE_PATTERNS = [
  '**/*.example',
  '**/*.sample',
  '**/test/**',
  '**/tests/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
];

export const apiKeyChecker: Checker = {
  id: 'api-key-checker',
  name: 'API Key Exposure Check',
  description: 'Checks for exposed API keys and secrets in code',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for exposed API keys in ${directory}...`);
    
    try {
      // Find all files to check
      const files = await getFiles(directory, FILE_PATTERNS, SAFE_PATTERNS);
      logger.debug(`Found ${files.length} files to scan`);
      
      // Loop through files
      for (const file of files) {
        try {
          // Skip binary files
          if (!(await isTextFile(file))) {
            continue;
          }
          
          const relativeFile = path.relative(directory, file);
          
          if (verbose) {
            logger.debug(`Scanning ${relativeFile}`);
          }
          
          // Read file content
          const content = await readFile(file);
          const lines = getFileContentWithLineNumbers(content);
          
          // Check file content for API key patterns
          for (const line of lines) {
            for (const pattern of API_KEY_PATTERNS) {
              const match = line.content.match(pattern);
              
              if (match) {
                // Calculate column where the key starts
                const keyStart = line.content.indexOf(match[1]);
                
                results.push({
                  id: 'api-key-exposed',
                  name: 'API Key Exposed',
                  description: 'Potential API key or secret found in code',
                  severity: 'high',
                  passed: false,
                  file: relativeFile,
                  line: line.line,
                  column: keyStart,
                  code: line.content.trim(),
                  details: `Found a possible API key in ${relativeFile}:${line.line}`,
                  recommendation: 'Move this key to a .env file and add it to .gitignore, or use a secret management service.'
                });
              }
            }
          }
        } catch (err) {
          logger.debug(`Error scanning file ${file}: ${err}`);
        }
      }
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'api-key-exposed',
          name: 'API Key Exposure Check',
          description: 'Checks for exposed API keys and secrets in code',
          severity: 'high',
          passed: true,
          details: 'No exposed API keys or secrets found'
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during API key check: ${err}`);
      
      return [{
        id: 'api-key-checker-error',
        name: 'API Key Check Error',
        description: 'An error occurred during the API key check',
        severity: 'medium',
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 