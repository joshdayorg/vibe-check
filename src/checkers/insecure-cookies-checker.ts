import * as path from 'path';
import { CheckResult, Checker, CheckOptions } from '../types';
import { findFiles, readFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// Cookie configuration patterns to check
const COOKIE_PATTERNS = {
  // Cookie setting patterns
  cookieSet: {
    // Browser document.cookie
    documentCookie: /document\.cookie\s*=\s*['"][^'"]*['"]/i,
    
    // Common server-side cookie setting
    setCookie: /(?:setCookie|set-cookie|cookie\s*\(\s*['"]?set)/i,
    
    // Express/Node.js
    expressRes: /res\.cookie\s*\(\s*['"][^'"]*['"],|\bres\.cookie\s*\([^)]*\)/i,
    
    // Next.js
    nextResponse: /(?:response|res)\.cookies\.set\s*\(|cookies\(\s*\)\s*\.set\s*\(/i,
    
    // Headers API
    headers: /headers\s*\(\s*\)\s*\.append\s*\(\s*['"]Set-Cookie['"],/i,

    // js-cookie library
    jsCookie: /Cookies\.set\s*\(\s*['"][^'"]*['"],/i
  },
  
  // Security attributes patterns
  security: {
    // Secure attribute
    secure: /secure\s*[:=]\s*true|secure\s*[;,]|['"];\s*secure\s*['"]/i,
    
    // HttpOnly attribute
    httpOnly: /httpOnly\s*[:=]\s*true|httpOnly\s*[;,]|['"];\s*httpOnly\s*['"]/i,
    
    // SameSite attribute
    sameSite: /sameSite\s*[:=]\s*['"]?(strict|lax|none)['"]?|['"];\s*samesite\s*=\s*(strict|lax|none)\s*['"]/i
  }
};

// File patterns to search
const CODE_FILE_PATTERNS = [
  // Frontend files
  '**/*.js', '**/*.jsx',
  '**/*.ts', '**/*.tsx',
  
  // Server-side files
  '**/api/**/*.js', '**/api/**/*.ts',
  '**/routes/**/*.js', '**/routes/**/*.ts',
  '**/server/**/*.js', '**/server/**/*.ts',
  '**/app/**/*.js', '**/app/**/*.ts',
  
  // Next.js specific
  '**/pages/**/*.js', '**/pages/**/*.ts',
  '**/pages/api/**/*.js', '**/pages/api/**/*.ts',
  '**/app/api/**/*.js', '**/app/api/**/*.ts',
  
  // Configuration
  '**/config/**/*.js', '**/config/**/*.ts'
];

export const insecureCookiesChecker: Checker = {
  id: 'insecure-cookies-checker',
  name: 'Insecure Cookies Check',
  description: 'Checks for insecure cookie configurations',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for insecure cookie configurations in ${directory}...`);
    
    try {
      // Find code files
      const codeFiles = await findFiles(directory, CODE_FILE_PATTERNS);
      logger.debug(`Found ${codeFiles.length} code files to scan`);
      
      if (codeFiles.length === 0) {
        logger.debug('No code files found');
        return [{
          id: 'insecure-cookies',
          name: 'Insecure Cookies Check',
          description: 'Check for insecure cookie configurations',
          severity: 'high',
          passed: true,
          details: 'No relevant code files found to scan'
        }];
      }
      
      // Loop through code files
      let fileCount = 0;
      let cookieUsageCount = 0;
      
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
          logger.debug(`Scanning ${relativeFile} for cookie configurations`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue;
        
        let foundCookieSetInFile = false;
        
        // Check for cookie setting operations
        const hasDocumentCookie = COOKIE_PATTERNS.cookieSet.documentCookie.test(content);
        const hasSetCookie = COOKIE_PATTERNS.cookieSet.setCookie.test(content);
        const hasExpressCookie = COOKIE_PATTERNS.cookieSet.expressRes.test(content);
        const hasNextCookie = COOKIE_PATTERNS.cookieSet.nextResponse.test(content);
        const hasHeadersCookie = COOKIE_PATTERNS.cookieSet.headers.test(content);
        const hasJsCookie = COOKIE_PATTERNS.cookieSet.jsCookie.test(content);
        
        if (hasDocumentCookie || hasSetCookie || hasExpressCookie || hasNextCookie || hasHeadersCookie || hasJsCookie) {
          cookieUsageCount++;
          foundCookieSetInFile = true;
          
          // Check for security attributes
          const hasSecure = COOKIE_PATTERNS.security.secure.test(content);
          const hasHttpOnly = COOKIE_PATTERNS.security.httpOnly.test(content);
          const hasSameSite = COOKIE_PATTERNS.security.sameSite.test(content);
          
          // Only check server-side cookies for httpOnly
          const isServerSide = hasSetCookie || hasExpressCookie || hasNextCookie || hasHeadersCookie;
          
          // Find lines where cookies are set
          const lines = content.split('\n');
          const cookieLines: {line: number, content: string}[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (
              COOKIE_PATTERNS.cookieSet.documentCookie.test(line) ||
              COOKIE_PATTERNS.cookieSet.setCookie.test(line) ||
              COOKIE_PATTERNS.cookieSet.expressRes.test(line) ||
              COOKIE_PATTERNS.cookieSet.nextResponse.test(line) ||
              COOKIE_PATTERNS.cookieSet.headers.test(line) ||
              COOKIE_PATTERNS.cookieSet.jsCookie.test(line)
            ) {
              cookieLines.push({
                line: i + 1,
                content: line.trim()
              });
            }
          }
          
          // If secure flag is missing
          if (!hasSecure) {
            results.push({
              id: 'missing-secure-flag',
              name: 'Missing Secure Flag in Cookies',
              description: 'Cookies are set without the Secure flag, allowing transmission over unencrypted connections',
              severity: 'high',
              passed: false,
              file: relativeFile,
              line: cookieLines.length > 0 ? cookieLines[0].line : undefined,
              code: cookieLines.length > 0 ? cookieLines[0].content : undefined,
              details: `Cookies set without Secure flag in ${relativeFile}`,
              recommendation: 'Add the Secure flag to ensure cookies are only sent over HTTPS connections'
            });
          }
          
          // If httpOnly flag is missing (for server-side cookies)
          if (isServerSide && !hasHttpOnly) {
            results.push({
              id: 'missing-httponly-flag',
              name: 'Missing HttpOnly Flag in Cookies',
              description: 'Server-side cookies are set without the HttpOnly flag, exposing them to client-side JavaScript',
              severity: 'high',
              passed: false,
              file: relativeFile,
              line: cookieLines.length > 0 ? cookieLines[0].line : undefined,
              code: cookieLines.length > 0 ? cookieLines[0].content : undefined,
              details: `Server-side cookies set without HttpOnly flag in ${relativeFile}`,
              recommendation: 'Add the HttpOnly flag to prevent client-side JavaScript from accessing cookies'
            });
          }
          
          // If sameSite attribute is missing
          if (!hasSameSite) {
            results.push({
              id: 'missing-samesite-attribute',
              name: 'Missing SameSite Attribute in Cookies',
              description: 'Cookies are set without the SameSite attribute, exposing them to CSRF attacks',
              severity: 'medium',
              passed: false,
              file: relativeFile,
              line: cookieLines.length > 0 ? cookieLines[0].line : undefined,
              code: cookieLines.length > 0 ? cookieLines[0].content : undefined,
              details: `Cookies set without SameSite attribute in ${relativeFile}`,
              recommendation: 'Add the SameSite=Strict or SameSite=Lax attribute to mitigate CSRF attacks'
            });
          }
        }
      }
      
      // If no cookie usage found
      if (cookieUsageCount === 0) {
        results.push({
          id: 'insecure-cookies',
          name: 'Insecure Cookies Check',
          description: 'Check for insecure cookie configurations',
          severity: 'high',
          passed: true,
          details: `No cookie usage found in ${fileCount} scanned files`
        });
      } else if (results.length === 0) {
        // If cookies are used but no issues found
        results.push({
          id: 'insecure-cookies',
          name: 'Insecure Cookies Check',
          description: 'Check for insecure cookie configurations',
          severity: 'high',
          passed: true,
          details: `Found ${cookieUsageCount} cookie usages with proper security configurations`
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during insecure cookies check: ${err}`);
      
      return [{
        id: 'insecure-cookies-error',
        name: 'Insecure Cookies Check Error',
        description: 'An error occurred during the insecure cookies check',
        severity: 'high',
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 