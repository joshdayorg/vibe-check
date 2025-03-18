import * as path from 'path';
import { CheckResult, Checker, CheckOptions } from '../types';
import { getFiles, readFile, isTextFile, getFileContentWithLineNumbers } from '../utils/file-utils';
import * as logger from '../utils/logger';

// Popular web frameworks and their patterns
const FRAMEWORK_PATTERNS = [
  // Express.js
  {
    name: 'Express.js',
    filePatterns: ['**/app.js', '**/server.js', '**/index.js', '**/app.ts', '**/server.ts', '**/index.ts'],
    routePatterns: [
      /app\.(?:use|get|post|put|delete|patch)/,
      /router\.(?:use|get|post|put|delete|patch)/,
      /express\(\)/
    ],
    rateLimitPatterns: [
      /express-rate-limit/,
      /rate-?limit/i,
      /new\s+RateLimit/,
      /limiter/
    ]
  },
  // Koa.js
  {
    name: 'Koa.js',
    filePatterns: ['**/app.js', '**/server.js', '**/index.js', '**/app.ts', '**/server.ts', '**/index.ts'],
    routePatterns: [
      /new\s+Koa\(\)/,
      /koa-router/,
      /router\.(?:use|get|post|put|delete|patch)/
    ],
    rateLimitPatterns: [
      /koa-ratelimit/,
      /ratelimit/i
    ]
  },
  // NestJS
  {
    name: 'NestJS',
    filePatterns: ['**/*.controller.ts', '**/main.ts'],
    routePatterns: [
      /@Controller/,
      /@Get\(/,
      /@Post\(/,
      /@Put\(/,
      /@Delete\(/,
      /@Patch\(/
    ],
    rateLimitPatterns: [
      /@UseGuards/,
      /ThrottlerGuard/,
      /ThrottlerModule/,
      /RateLimit/
    ]
  },
  // Fastify
  {
    name: 'Fastify',
    filePatterns: ['**/app.js', '**/server.js', '**/index.js', '**/app.ts', '**/server.ts', '**/index.ts'],
    routePatterns: [
      /fastify\(/,
      /\.route\(/,
      /\.get\(/,
      /\.post\(/
    ],
    rateLimitPatterns: [
      /fastify-rate-limit/,
      /[@']fastify\/rate-limit/
    ]
  },
  // Next.js API routes
  {
    name: 'Next.js API',
    filePatterns: ['**/pages/api/**/*.js', '**/pages/api/**/*.ts'],
    routePatterns: [
      /export\s+(?:default|const|async\s+function)/
    ],
    rateLimitPatterns: [
      /rate-?limit/i,
      /api-rate-limit/,
      /nc\(\)/,  // nextConnect pattern
      /nc\(\)\.use\(.*limiter/
    ]
  }
];

export const rateLimitChecker: Checker = {
  id: 'rate-limit-checker',
  name: 'API Rate Limiting Check',
  description: 'Checks if API endpoints have rate limiting configured',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    let apiFilesFound = false;
    
    logger.info(`Scanning for API rate limiting issues in ${directory}...`);
    
    try {
      for (const framework of FRAMEWORK_PATTERNS) {
        const files = await getFiles(directory, framework.filePatterns);
        
        if (files.length > 0) {
          apiFilesFound = true;
        }
        
        for (const file of files) {
          try {
            // Skip binary files
            if (!(await isTextFile(file))) {
              continue;
            }
            
            const relativeFile = path.relative(directory, file);
            
            if (verbose) {
              logger.debug(`Scanning ${relativeFile} for ${framework.name} API endpoints`);
            }
            
            // Read file content
            const content = await readFile(file);
            const lines = getFileContentWithLineNumbers(content);
            
            // Check if this file contains API endpoints
            let hasRoutes = false;
            for (const routePattern of framework.routePatterns) {
              if (routePattern.test(content)) {
                hasRoutes = true;
                break;
              }
            }
            
            if (!hasRoutes) {
              continue;
            }
            
            // Check if rate limiting is implemented
            let hasRateLimit = false;
            for (const rateLimitPattern of framework.rateLimitPatterns) {
              if (rateLimitPattern.test(content)) {
                hasRateLimit = true;
                break;
              }
            }
            
            if (!hasRateLimit) {
              results.push({
                id: 'rate-limit-missing',
                name: 'Missing API Rate Limiting',
                description: `${framework.name} API endpoints without rate limiting protection`,
                severity: 'medium',
                passed: false,
                file: relativeFile,
                details: `Found ${framework.name} API endpoints without rate limiting in ${relativeFile}`,
                recommendation: `Add rate limiting middleware to protect your ${framework.name} API endpoints from abuse.`
              });
            } else {
              results.push({
                id: 'rate-limit-implemented',
                name: 'API Rate Limiting',
                description: `${framework.name} API endpoints with rate limiting protection`,
                severity: 'medium',
                passed: true,
                file: relativeFile,
                details: `Found ${framework.name} API endpoints with rate limiting in ${relativeFile}`
              });
            }
            
          } catch (err) {
            logger.debug(`Error scanning file ${file}: ${err}`);
          }
        }
      }
      
      // If no API files were found or no issues detected
      if (!apiFilesFound) {
        results.push({
          id: 'rate-limit-check',
          name: 'API Rate Limiting Check',
          description: 'No API endpoints were detected in the codebase',
          severity: 'medium',
          passed: true,
          details: 'No API endpoints were found in the scanned codebase'
        });
      } else if (results.length === 0) {
        results.push({
          id: 'rate-limit-check',
          name: 'API Rate Limiting Check',
          description: 'All detected API endpoints have rate limiting protection',
          severity: 'medium',
          passed: true,
          details: 'All API endpoints seem to have rate limiting implemented'
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during rate limit check: ${err}`);
      
      return [{
        id: 'rate-limit-checker-error',
        name: 'Rate Limit Check Error',
        description: 'An error occurred during the rate limit check',
        severity: 'medium',
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 