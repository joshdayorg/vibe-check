import * as path from 'path';
import { CheckResult, Checker, CheckOptions } from '../types';
import { findFiles, readFile, isTextFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// API key patterns for various services
const API_KEY_PATTERNS = [
  {
    service: 'Supabase',
    pattern: /['"](?:eyJ[a-zA-Z0-9_\-\.]+)\.eyJ[a-zA-Z0-9_\-\.]+\.(?:[a-zA-Z0-9_\-\.]+)['"]|['"](?:sb(?:p|st|o)_[a-f0-9]{40,60})['"]/g,
    recommendation: 'Use environment variables for Supabase keys and ensure they are not exposed on the client side'
  },
  {
    service: 'OpenAI',
    pattern: /['"](?:sk-[a-zA-Z0-9]{20,})(?:T3BlbkF[a-zA-Z0-9]+)?['"]/g,
    recommendation: 'Store OpenAI API keys in server-side environment variables'
  },
  {
    service: 'Anthropic',
    pattern: /['"](?:sk-ant-api03-[a-zA-Z0-9-]{32,})['"]/g,
    recommendation: 'Store Anthropic API keys in server-side environment variables'
  },
  {
    service: 'Google API',
    pattern: /['"](?:AIza[a-zA-Z0-9_\-]{35})['"]/g,
    recommendation: 'Store Google API keys in server-side environment variables'
  },
  {
    service: 'GitHub',
    pattern: /['"](?:gh[ps]_[a-zA-Z0-9]{36,40})['"]/g,
    recommendation: 'Remove GitHub tokens and use environment variables instead'
  },
  {
    service: 'AWS',
    pattern: /['"](?:AKIA[0-9A-Z]{16})['"]/g,
    recommendation: 'Remove AWS access keys and use environment variables or IAM roles instead'
  },
  {
    service: 'Generic',
    pattern: /(?:api|access)[-_]?key['"]?\s*[=:]\s*['"]([a-zA-Z0-9_\-.~+\/]{16,64})['"]|['"]([a-zA-Z0-9]{32,64})['"]/gi,
    recommendation: 'Store API keys in server-side environment variables'
  }
];

// File patterns to search
const CODE_FILE_PATTERNS = [
  // JavaScript/TypeScript
  '**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx',
  // Other web files
  '**/*.html', '**/*.vue', '**/*.svelte',
  // Configuration files
  '**/*.json', '**/*.yaml', '**/*.yml',
  // Ignore node_modules, build directories, etc. - handled by file-utils
];

// Files to exclude even if they match patterns
const EXCLUDED_PATHS = [
  '**/node_modules/**',
  '**/dist/**', 
  '**/build/**',
  '**/.git/**',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/*.min.js',
];

export const apiKeyChecker: Checker = {
  id: 'api-key-checker',
  name: 'API Key Exposure Check',
  description: 'Checks for hardcoded API keys and secrets in source code',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, ignorePatterns = [], verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for hardcoded API keys in ${directory}...`);
    
    try {
      // Find all code files to scan
      const codeFiles = await findFiles(
        directory, 
        CODE_FILE_PATTERNS
      );
      
      logger.debug(`Found ${codeFiles.length} code files to scan`);
      
      // No code files found
      if (codeFiles.length === 0) {
        logger.debug('No code files found to scan');
        return [{
          id: 'api-key-exposure',
          name: 'API Key Exposure Check',
          description: 'Check for hardcoded API keys in source code',
          severity: 'critical',
          passed: true,
          details: 'No code files found to scan'
        }];
      }
      
      // Loop through code files
      let scannedFileCount = 0;
      
      for (const file of codeFiles) {
        const relativeFile = path.relative(directory, file);
        
        // Skip excluded paths
        if (EXCLUDED_PATHS.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(relativeFile);
        })) {
          continue;
        }
        
        // Skip if in ignore patterns
        if (ignorePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(relativeFile);
        })) {
          continue;
        }
        
        // Check if it's a text file (skip binary files)
        if (!(await isTextFile(file))) {
          continue;
        }
        
        scannedFileCount++;
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for API keys`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue; // Skip if file couldn't be read
        
        const lines = content.split('\n');
        
        // Check each pattern against the whole file
        for (const { service, pattern, recommendation } of API_KEY_PATTERNS) {
          // Need to reset pattern's lastIndex before each use since we're using /g flag
          pattern.lastIndex = 0;
          
          // Find all matches in the file
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            pattern.lastIndex = 0; // Reset pattern for each line
            
            let match;
            while ((match = pattern.exec(line)) !== null) {
              // Skip if the line appears to be a test or example
              const lowerLine = line.toLowerCase();
              if (
                lowerLine.includes('example') ||
                lowerLine.includes('placeholder') ||
                lowerLine.includes('test') ||
                lowerLine.includes('mock') ||
                lowerLine.includes('fake')
              ) {
                continue;
              }
              
              const key = match[0].replace(/['"]/g, '');
              
              // Skip if the key appears to be a placeholder
              if (
                key.includes('your_api_key') ||
                key.includes('xxx') ||
                key.includes('YOUR_') ||
                key.includes('API_KEY_HERE')
              ) {
                continue;
              }
              
              results.push({
                id: `api-key-${service.toLowerCase()}`,
                name: `Exposed ${service} API Key`,
                description: `Found a hardcoded ${service} API key in source code`,
                severity: 'critical',
                passed: false,
                file: relativeFile,
                line: i + 1,
                column: match.index + 1,
                code: line.trim(),
                details: `Hardcoded ${service} API key found in ${relativeFile}:${i + 1}`,
                recommendation: recommendation
              });
            }
          }
        }
      }
      
      logger.debug(`Scanned ${scannedFileCount} files for API keys`);
      
      // If no issues were found, add a passing result
      if (results.length === 0) {
        results.push({
          id: 'api-key-exposure',
          name: 'API Key Exposure Check',
          description: 'Check for hardcoded API keys in source code',
          severity: 'critical',
          passed: true,
          details: `No hardcoded API keys found in ${scannedFileCount} scanned files`
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during API key check: ${err}`);
      
      return [{
        id: 'api-key-error',
        name: 'API Key Check Error',
        description: 'An error occurred during the API key check',
        severity: 'critical',
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 