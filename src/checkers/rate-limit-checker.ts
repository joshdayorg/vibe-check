import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../types';
import { findFiles, readFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// Common rate-limiting packages for Next.js
const RATE_LIMIT_PACKAGES = [
  'rate-limiter-flexible',
  'express-rate-limit',
  '@upstash/ratelimit',
  'next-rate-limit',
  'limiter',
  'rate-limit',
  'rate_limit'
];

// Common rate-limiting patterns in code
const RATE_LIMIT_PATTERNS = [
  // Generic rate limiting pattern
  /(?:rateLimiter|rateLimit|limiting|limiter)/i,
  // Specific package usage
  /(?:import|require)\s*\(\s*['"](?:rate-limiter-flexible|express-rate-limit|@upstash\/ratelimit|next-rate-limit|limiter)['"]\s*\)/,
  // Manual rate limiting with Redis or other storage
  /(?:redis|storage|db|cache)\.(?:incr|get|set|increment|add)/i,
  // Rate limiting directive from libraries
  /\.(?:rateLimit|rateLimiter|limit|throttle)\(/
];

export const rateLimitChecker: Checker = {
  id: 'rate-limit-checker',
  name: 'API Rate Limiting Check',
  description: 'Checks for missing rate limiting in API routes or endpoints',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for missing rate limiting in ${directory}...`);
    
    try {
      // Find Next.js API files
      const apiFiles = await findFiles(directory, [
        // Next.js API routes
        '**/pages/api/**/*.js',
        '**/pages/api/**/*.ts',
        '**/app/api/**/route.js',
        '**/app/api/**/route.ts',
        // Express-like routes
        '**/routes/**/*.js',
        '**/routes/**/*.ts',
        '**/controllers/**/*.js',
        '**/controllers/**/*.ts'
      ]);
      
      logger.debug(`Found ${apiFiles.length} API files to scan`);
      
      // No API files found
      if (apiFiles.length === 0) {
        logger.debug('No API files found');
        return [{
          id: 'rate-limit',
          name: 'API Rate Limiting Check',
          description: 'Check for missing rate limiting in API routes',
          severity: Severity.Medium,
          passed: true,
          details: 'No API files found to scan'
        }];
      }
      
      // Check package.json for rate limiting packages
      let packageJsonPath = path.join(directory, 'package.json');
      let hasRateLimitingPackage = false;
      
      try {
        const packageJsonContent = await readFile(packageJsonPath);
        
        if (packageJsonContent) {
          const packageJson = JSON.parse(packageJsonContent);
          const dependencies = { 
            ...(packageJson.dependencies || {}), 
            ...(packageJson.devDependencies || {}) 
          };
          
          // Check if any rate-limiting package is installed
          hasRateLimitingPackage = RATE_LIMIT_PACKAGES.some(pkg => 
            Object.keys(dependencies).includes(pkg)
          );
          
          if (hasRateLimitingPackage && verbose) {
            logger.debug('Rate limiting package found in package.json');
          }
        }
      } catch (err) {
        logger.debug(`Could not read package.json: ${err}`);
      }
      
      // Track which routes have rate limiting
      const routesWithRateLimiting: Record<string, boolean> = {};
      
      // Check middleware files for global rate limiting
      const middlewareFiles = await findFiles(directory, [
        '**/middleware.js',
        '**/middleware.ts'
      ]);
      
      let hasGlobalRateLimit = false;
      
      for (const file of middlewareFiles) {
        const content = await readFile(file);
        
        if (content) {
          for (const pattern of RATE_LIMIT_PATTERNS) {
            if (pattern.test(content)) {
              hasGlobalRateLimit = true;
              if (verbose) {
                logger.debug(`Found global rate limiting in ${path.relative(directory, file)}`);
              }
              break;
            }
          }
        }
      }
      
      // Check API files for rate limiting
      for (const file of apiFiles) {
        const relativeFile = path.relative(directory, file);
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for rate limiting`);
        }
        
        const content = await readFile(file);
        if (!content) continue;
        
        let hasRateLimit = false;
        
        // Check if the file mentions rate limiting
        for (const pattern of RATE_LIMIT_PATTERNS) {
          if (pattern.test(content)) {
            hasRateLimit = true;
            break;
          }
        }
        
        // Skip the check if a global rate limiting middleware is in place
        if (hasGlobalRateLimit) {
          hasRateLimit = true;
        }
        
        routesWithRateLimiting[relativeFile] = hasRateLimit;
        
        if (!hasRateLimit) {
          // Check if this appears to be a public API route
          const isProbablyPublicApi = 
            content.includes('export default') || 
            content.includes('export async function') ||
            content.includes('export const');
          
          // Check if this appears to be a mutation/write operation (more critical)
          const isProbablyMutation = 
            /(?:post|put|delete|create|update|edit|remove|add)\b/i.test(content) || 
            /req\.(?:body|method)\s*(?:!==?\s*['"]GET['"]|===?\s*['"]POST['"]|===?\s*['"]PUT['"]|===?\s*['"]DELETE['"])/i.test(content);
          
          // Only report if it looks like a public API
          if (isProbablyPublicApi) {
            results.push({
              id: 'rate-limit-missing',
              name: 'Missing API Rate Limiting',
              description: 'API route does not implement rate limiting',
              severity: isProbablyMutation ? Severity.High : Severity.Medium,
              passed: false,
              file: relativeFile,
              details: `API route in ${relativeFile} does not appear to implement rate limiting, which could lead to abuse or DoS`,
              recommendation: hasRateLimitingPackage 
                ? 'Add rate limiting middleware to this API route' 
                : 'Install a rate limiting package like rate-limiter-flexible or @upstash/ratelimit and apply it to this API route'
            });
          }
        }
      }
      
      // Summary of findings
      const routesWithoutRateLimit = Object.entries(routesWithRateLimiting)
        .filter(([_, hasLimit]) => !hasLimit)
        .map(([route, _]) => route);
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'rate-limit',
          name: 'API Rate Limiting Check',
          description: 'Check for missing rate limiting in API routes',
          severity: Severity.Medium,
          passed: true,
          details: hasGlobalRateLimit 
            ? 'Global rate limiting is implemented' 
            : 'All API routes have rate limiting implemented'
        });
      } else {
        // Add a summary result if there are multiple routes missing rate limiting
        if (routesWithoutRateLimit.length > 1) {
          results.push({
            id: 'rate-limit-summary',
            name: 'Rate Limiting Summary',
            description: 'Summary of API routes missing rate limiting',
            severity: Severity.Medium,
            passed: false,
            details: `${routesWithoutRateLimit.length} API routes are missing rate limiting protection`,
            recommendation: hasRateLimitingPackage
              ? 'Consider implementing global rate limiting in middleware.ts or add rate limiting to each API route'
              : 'Install a rate limiting package and implement global rate limiting in middleware.ts'
          });
        }
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during rate limit check: ${err}`);
      
      return [{
        id: 'rate-limit-error',
        name: 'Rate Limiting Check Error',
        description: 'An error occurred during the rate limiting check',
        severity: Severity.Medium,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 