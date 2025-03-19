import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../types';
import { findFiles, readFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// Patterns that suggest JWT tokens might be stored in localStorage or sessionStorage
const JWT_STORAGE_PATTERNS = [
  // localStorage with JWT/token
  /localStorage\.setItem\(\s*['"](?:token|jwt|accessToken|access_token|auth|authentication)['"].*?\)/i,
  /localStorage\[['"](?:token|jwt|accessToken|access_token|auth|authentication)['"].*?\]/i,
  
  // sessionStorage with JWT/token
  /sessionStorage\.setItem\(\s*['"](?:token|jwt|accessToken|access_token|auth|authentication)['"].*?\)/i,
  /sessionStorage\[['"](?:token|jwt|accessToken|access_token|auth|authentication)['"].*?\]/i,
  
  // Assignment to one of these storage objects
  /(?:localStorage|sessionStorage)\s*=\s*.*?['"](?:token|jwt|accessToken|access_token)['"].*?\)/i,
  
  // Common JWT libraries with localStorage
  /(?:jwt|jose|jsonwebtoken).*?(?:localStorage|sessionStorage)/i,
  /(?:localStorage|sessionStorage).*?(?:jwt|jose|jsonwebtoken)/i,
  
  // Auth-specific libraries with localStorage
  /(?:auth0|firebase|amplify|oauth).*?(?:localStorage|sessionStorage)/i
];

// File patterns to search
const CLIENT_CODE_PATTERNS = [
  // Frontend JavaScript/TypeScript
  '**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx',
  // Other frontend frameworks
  '**/*.vue', '**/*.svelte', '**/*.html',
  // Exclude test files, node_modules, etc. - handled by file-utils
];

export const jwtStorageChecker: Checker = {
  id: 'jwt-storage-checker',
  name: 'JWT in Browser Storage Check',
  description: 'Checks for JWT tokens stored in localStorage or sessionStorage',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for insecure JWT storage in ${directory}...`);
    
    try {
      // Find frontend code files
      const codeFiles = await findFiles(directory, CLIENT_CODE_PATTERNS);
      logger.debug(`Found ${codeFiles.length} frontend files to scan`);
      
      if (codeFiles.length === 0) {
        logger.debug('No frontend code files found');
        return [{
          id: 'jwt-storage',
          name: 'JWT in Browser Storage Check',
          description: 'Check for JWT tokens stored in localStorage or sessionStorage',
          severity: Severity.High,
          passed: true,
          details: 'No frontend code files found to scan'
        }];
      }
      
      // Loop through frontend code files
      let fileCount = 0;
      
      for (const file of codeFiles) {
        const relativeFile = path.relative(directory, file);
        
        // Skip node_modules, test files, etc.
        if (
          relativeFile.includes('node_modules') ||
          relativeFile.includes('test') ||
          relativeFile.includes('dist') ||
          relativeFile.includes('build')
        ) {
          continue;
        }
        
        fileCount++;
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for insecure JWT storage`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue;
        
        // Check for JWT storage patterns
        for (const pattern of JWT_STORAGE_PATTERNS) {
          const matches = content.match(pattern);
          
          if (matches) {
            // Find the line number for the match
            const lines = content.split('\n');
            let lineNumber = 0;
            let lineContent = '';
            
            for (let i = 0; i < lines.length; i++) {
              if (pattern.test(lines[i])) {
                lineNumber = i + 1;
                lineContent = lines[i].trim();
                break;
              }
            }
            
            results.push({
              id: 'jwt-local-storage',
              name: 'JWT Token in Browser Storage',
              description: 'JWT tokens stored in localStorage or sessionStorage can be vulnerable to XSS attacks',
              severity: Severity.High,
              passed: false,
              file: relativeFile,
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              details: `Found potential JWT token stored in browser storage in ${relativeFile}${lineNumber ? `:${lineNumber}` : ''}`,
              recommendation: 'Store JWT tokens in HttpOnly cookies instead of localStorage or sessionStorage to protect against XSS attacks'
            });
            
            // Only report the first instance per file to avoid duplicates
            break;
          }
        }
      }
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'jwt-storage',
          name: 'JWT in Browser Storage Check',
          description: 'Check for JWT tokens stored in localStorage or sessionStorage',
          severity: Severity.High,
          passed: true,
          details: `No JWT tokens found stored in localStorage or sessionStorage in ${fileCount} files`
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during JWT storage check: ${err}`);
      
      return [{
        id: 'jwt-storage-error',
        name: 'JWT Storage Check Error',
        description: 'An error occurred during the JWT storage check',
        severity: Severity.Medium,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 