import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../types';
import { findFiles, readFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// CORS configuration patterns to check
const CORS_PATTERNS = {
  // Insecure wildcard origin
  wildcard: /(?:Access-Control-Allow-Origin:|\bres\.header\(['"]Access-Control-Allow-Origin['"],|\bheaders\s*[=:]\s*[{][^}]*['"]Access-Control-Allow-Origin['"]\s*[=:]\s*)['"]?\*['"]?/i,
  
  // Setting CORS dynamically based on request origin
  dynamicOrigin: /req\.headers\.origin|request\.headers\.origin|\$\{?(?:req|request)\.headers\.origin/i,
  
  // CORS with credentials
  credentials: /(?:Access-Control-Allow-Credentials:|\bres\.header\(['"]Access-Control-Allow-Credentials['"],|\bheaders\s*[=:]\s*[{][^}]*['"]Access-Control-Allow-Credentials['"]\s*[=:]\s*)['"]?true['"]?/i,
  
  // CORS configuration for specific Next.js files
  nextConfig: /(?:module\.exports|export default|export const)\s*=\s*[{][^}]*async(?:Headers|Origin|Methods)/i,
  
  // Express CORS middleware
  expressCors: /cors\s*\(\s*\{[^}]*origin\s*:\s*['"]?\*/i
};

// File patterns to search
const SERVER_FILE_PATTERNS = [
  // Server-side JavaScript/TypeScript
  '**/server.js', '**/server.ts',
  '**/server/*.js', '**/server/*.ts',
  '**/api/**/*.js', '**/api/**/*.ts',
  '**/routes/**/*.js', '**/routes/**/*.ts',
  '**/app.js', '**/app.ts',
  // Next.js specific
  '**/next.config.js', '**/next.config.ts',
  '**/middleware.js', '**/middleware.ts',
  '**/pages/api/**/*.js', '**/pages/api/**/*.ts',
  // Express files
  '**/express/**/*.js', '**/express/**/*.ts',
  // Config files
  '**/config/**/*.js', '**/config/**/*.ts'
];

export const corsChecker: Checker = {
  id: 'cors-checker',
  name: 'CORS Configuration Check',
  description: 'Checks for misconfigurations in Cross-Origin Resource Sharing (CORS) settings',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for CORS misconfigurations in ${directory}...`);
    
    try {
      // Find server-side code files
      const serverFiles = await findFiles(directory, SERVER_FILE_PATTERNS);
      logger.debug(`Found ${serverFiles.length} server files to scan`);
      
      if (serverFiles.length === 0) {
        logger.debug('No server-side files found');
        return [{
          id: 'cors-config',
          name: 'CORS Configuration Check',
          description: 'Check for misconfigurations in CORS settings',
          severity: Severity.High,
          passed: true,
          details: 'No server-side files found to scan'
        }];
      }
      
      // Loop through server-side files
      let fileCount = 0;
      const wildcardOriginFiles: string[] = [];
      const dynamicOriginFiles: string[] = [];
      const credentialsWithWildcardFiles: string[] = [];
      
      for (const file of serverFiles) {
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
          logger.debug(`Scanning ${relativeFile} for CORS misconfigurations`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue;
        
        // Check for wildcard origin '*'
        if (CORS_PATTERNS.wildcard.test(content)) {
          wildcardOriginFiles.push(relativeFile);
          
          // Find the line number
          const lines = content.split('\n');
          let lineNumber = 0;
          let lineContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            if (CORS_PATTERNS.wildcard.test(lines[i])) {
              lineNumber = i + 1;
              lineContent = lines[i].trim();
              break;
            }
          }
          
          results.push({
            id: 'cors-wildcard-origin',
            name: 'CORS Wildcard Origin',
            description: 'CORS configured with wildcard origin (*) allows any website to make requests',
            severity: Severity.Medium,
            passed: false,
            file: relativeFile,
            location: {
              file: relativeFile,
              line: lineNumber,
              code: lineContent
            },
            details: `CORS wildcard origin (*) found in ${relativeFile}${lineNumber ? `:${lineNumber}` : ''}`,
            recommendation: 'Specify exact origins instead of using a wildcard (*). For example: origin: "https://example.com"'
          });
        }
        
        // Check for dynamic origin + credentials (critical issue)
        if (CORS_PATTERNS.dynamicOrigin.test(content) && CORS_PATTERNS.credentials.test(content)) {
          credentialsWithWildcardFiles.push(relativeFile);
          
          // Find the line number (just find credentials line for simplicity)
          const lines = content.split('\n');
          let lineNumber = 0;
          let lineContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            if (CORS_PATTERNS.credentials.test(lines[i])) {
              lineNumber = i + 1;
              lineContent = lines[i].trim();
              break;
            }
          }
          
          results.push({
            id: 'cors-credentials-dynamic-origin',
            name: 'CORS with Credentials and Dynamic Origin',
            description: 'Using credentials with a dynamic origin can lead to security vulnerabilities',
            severity: Severity.Critical,
            passed: false,
            file: relativeFile,
            location: {
              file: relativeFile,
              line: lineNumber,
              code: lineContent
            },
            details: `CORS with credentials and dynamic origin found in ${relativeFile}${lineNumber ? `:${lineNumber}` : ''}`,
            recommendation: 'Only use credentials with a specific static origin, never with a dynamic origin based on request headers'
          });
        }
        
        // Check for express cors() with wildcard
        if (CORS_PATTERNS.expressCors.test(content)) {
          // Find the line number
          const lines = content.split('\n');
          let lineNumber = 0;
          let lineContent = '';
          
          for (let i = 0; i < lines.length; i++) {
            if (CORS_PATTERNS.expressCors.test(lines[i])) {
              lineNumber = i + 1;
              lineContent = lines[i].trim();
              break;
            }
          }
          
          results.push({
            id: 'cors-express-wildcard',
            name: 'Express CORS Wildcard',
            description: 'Express CORS middleware with wildcard origin allows requests from any origin',
            severity: Severity.Medium,
            passed: false,
            file: relativeFile,
            location: {
              file: relativeFile,
              line: lineNumber,
              code: lineContent
            },
            details: `Express CORS middleware with wildcard origin found in ${relativeFile}${lineNumber ? `:${lineNumber}` : ''}`,
            recommendation: 'Specify an array of allowed origins instead of using a wildcard, e.g., origin: ["https://example.com"]'
          });
        }
      }
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'cors-config',
          name: 'CORS Configuration Check',
          description: 'Check for misconfigurations in CORS settings',
          severity: Severity.High,
          passed: true,
          details: `No CORS misconfigurations found in ${fileCount} server-side files`
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during CORS configuration check: ${err}`);
      
      return [{
        id: 'cors-error',
        name: 'CORS Check Error',
        description: 'An error occurred during the CORS configuration check',
        severity: Severity.Medium,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 