import * as path from 'path';
import { CheckResult, Checker, CheckOptions, Severity } from '../types';
import { findFiles, readFile } from '../utils/file-utils';
import * as logger from '../utils/logger';

// AI API usage patterns
const AI_API_PATTERNS = {
  // OpenAI API patterns
  openai: {
    usage: /new OpenAI|openai\.(?:chat\.completions|completions|embeddings|images)/i,
    costControl: /maxTokens|max_tokens|temperature|frequency_penalty|presence_penalty|top_p|n\s*:|max_retries|timeout/i,
    budgetControl: /(?:token|budget|cost)(?:Limit|Cap|Max|Monitor|Track|Count|Usage)/i
  },
  
  // Anthropic API patterns
  anthropic: {
    usage: /new\s+Anthropic|anthropic\.(?:messages|completions)/i,
    costControl: /max_tokens|max_tokens_to_sample|temperature|top_p|top_k|stop_sequences/i,
    budgetControl: /(?:token|budget|cost)(?:Limit|Cap|Max|Monitor|Track|Count|Usage)/i
  },
  
  // Cohere API patterns
  cohere: {
    usage: /new\s+CohereClient|cohere\.(?:generate|chat|embed|classify|summarize)/i,
    costControl: /max_tokens|temperature|p|k|frequency_penalty|presence_penalty|truncate/i,
    budgetControl: /(?:token|budget|cost)(?:Limit|Cap|Max|Monitor|Track|Count|Usage)/i
  },
  
  // Generic AI services
  generic: {
    rateLimit: /(?:rate|request)(?:Limit|Cap|Max)/i,
    budgetControl: /(?:token|budget|cost)(?:Limit|Cap|Max|Monitor|Track|Count|Usage)/i,
    errorHandling: /try\s*{[^}]*(?:openai|anthropic|cohere|replicate|stability)[^}]*}\s*catch/i
  }
};

// File patterns to search
const CODE_FILE_PATTERNS = [
  // JavaScript/TypeScript files
  '**/*.js', '**/*.jsx',
  '**/*.ts', '**/*.tsx',
  // AI-related directories
  '**/ai/**/*.js', '**/ai/**/*.ts',
  '**/llm/**/*.js', '**/llm/**/*.ts',
  '**/api/ai/**/*.js', '**/api/ai/**/*.ts',
  // Config files
  '**/config/**/*.js', '**/config/**/*.ts',
  // Server files
  '**/server/**/*.js', '**/server/**/*.ts',
  // Service files
  '**/services/**/*.js', '**/services/**/*.ts'
];

// Files to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  'test',
  '__tests__',
  '__mocks__',
  '*.test.js',
  '*.test.ts',
  '*.spec.js',
  '*.spec.ts'
];

export const aiCostControlsChecker: Checker = {
  id: 'ai-cost-controls-checker',
  name: 'AI API Cost Controls Check',
  description: 'Checks for missing cost controls when using AI APIs',
  
  async check(options: CheckOptions): Promise<CheckResult[]> {
    const { directory, verbose = false } = options;
    const results: CheckResult[] = [];
    
    logger.info(`Scanning for AI API usage without cost controls in ${directory}...`);
    
    try {
      // Find code files
      const codeFiles = await findFiles(directory, CODE_FILE_PATTERNS);
      logger.debug(`Found ${codeFiles.length} code files to scan`);
      
      if (codeFiles.length === 0) {
        logger.debug('No code files found');
        return [{
          id: 'ai-cost-controls',
          name: 'AI API Cost Controls Check',
          description: 'Check for missing cost controls when using AI APIs',
          severity: Severity.Medium,
          passed: true,
          details: 'No relevant code files found to scan'
        }];
      }
      
      // Loop through code files
      let fileCount = 0;
      let openaiUsage = 0;
      let anthropicUsage = 0;
      let cohereUsage = 0;
      let lineNumber = 0;
      let lineContent = '';
      let relativeFile = '';
      
      for (const file of codeFiles) {
        relativeFile = path.relative(directory, file);
        
        // Skip files matching ignore patterns
        if (IGNORE_PATTERNS.some(pattern => relativeFile.includes(pattern))) {
          continue;
        }
        
        fileCount++;
        
        if (verbose) {
          logger.debug(`Scanning ${relativeFile} for AI API usage`);
        }
        
        // Read file content
        const content = await readFile(file);
        if (!content) continue;
        
        // Check for OpenAI usage
        if (AI_API_PATTERNS.openai.usage.test(content)) {
          openaiUsage++;
          
          // Check if cost controls are missing
          const hasCostControl = AI_API_PATTERNS.openai.costControl.test(content);
          const hasBudgetControl = AI_API_PATTERNS.generic.budgetControl.test(content);
          const hasErrorHandling = AI_API_PATTERNS.generic.errorHandling.test(content);
          
          if (!hasCostControl) {
            // Find line number of usage
            const lines = content.split('\n');
            let lineNumber = 0;
            let lineContent = '';
            
            for (let i = 0; i < lines.length; i++) {
              if (AI_API_PATTERNS.openai.usage.test(lines[i])) {
                lineNumber = i + 1;
                lineContent = lines[i].trim();
                break;
              }
            }
            
            results.push({
              id: 'openai-missing-parameter-controls',
              name: 'OpenAI API Missing Parameter Controls',
              description: 'OpenAI API usage detected without parameter controls to limit tokens or control generation',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.Medium,
              passed: false,
              details: `OpenAI API usage without parameter controls in ${relativeFile}${lineNumber ? `:${lineNumber}` : ''}`,
              recommendation: 'Add parameter controls like maxTokens, temperature, and frequency_penalty to limit costs'
            });
          }
          
          if (!hasBudgetControl) {
            results.push({
              id: 'openai-missing-budget-controls',
              name: 'OpenAI API Missing Budget Controls',
              description: 'OpenAI API usage detected without budget tracking mechanisms',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.High,
              passed: false,
              details: `OpenAI API usage without budget controls in ${relativeFile}`,
              recommendation: 'Implement token counting and budget tracking mechanisms to prevent unexpected costs'
            });
          }
          
          if (!hasErrorHandling) {
            results.push({
              id: 'openai-missing-error-handling',
              name: 'OpenAI API Missing Error Handling',
              description: 'OpenAI API usage detected without proper error handling',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.Medium,
              passed: false,
              details: `OpenAI API usage without error handling in ${relativeFile}`,
              recommendation: 'Add try/catch blocks with proper error handling to manage API failures and prevent unnecessary retries'
            });
          }
        }
        
        // Check for Anthropic usage
        if (AI_API_PATTERNS.anthropic.usage.test(content)) {
          anthropicUsage++;
          
          // Check if cost controls are missing
          const hasCostControl = AI_API_PATTERNS.anthropic.costControl.test(content);
          const hasBudgetControl = AI_API_PATTERNS.generic.budgetControl.test(content);
          const hasErrorHandling = AI_API_PATTERNS.generic.errorHandling.test(content);
          
          if (!hasCostControl) {
            results.push({
              id: 'anthropic-missing-parameter-controls',
              name: 'Anthropic API Missing Parameter Controls',
              description: 'Anthropic API usage detected without parameter controls to limit tokens',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.Medium,
              passed: false,
              details: `Anthropic API usage without parameter controls in ${relativeFile}`,
              recommendation: 'Add parameter controls like max_tokens_to_sample, temperature, and top_p to limit costs'
            });
          }
          
          if (!hasBudgetControl) {
            results.push({
              id: 'anthropic-missing-budget-controls',
              name: 'Anthropic API Missing Budget Controls',
              description: 'Anthropic API usage detected without budget tracking mechanisms',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.High,
              passed: false,
              details: `Anthropic API usage without budget controls in ${relativeFile}`,
              recommendation: 'Implement token counting and budget tracking mechanisms to prevent unexpected costs'
            });
          }
          
          if (!hasErrorHandling) {
            results.push({
              id: 'anthropic-missing-error-handling',
              name: 'Anthropic API Missing Error Handling',
              description: 'Anthropic API usage detected without proper error handling',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.Medium,
              passed: false,
              details: `Anthropic API usage without error handling in ${relativeFile}`,
              recommendation: 'Add try/catch blocks with proper error handling to manage API failures'
            });
          }
        }
        
        // Check for Cohere usage
        if (AI_API_PATTERNS.cohere.usage.test(content)) {
          cohereUsage++;
          
          // Check if cost controls are missing
          const hasCostControl = AI_API_PATTERNS.cohere.costControl.test(content);
          const hasBudgetControl = AI_API_PATTERNS.generic.budgetControl.test(content);
          
          if (!hasCostControl) {
            results.push({
              id: 'cohere-missing-parameter-controls',
              name: 'Cohere API Missing Parameter Controls',
              description: 'Cohere API usage detected without parameter controls to limit tokens',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.Medium,
              passed: false,
              details: `Cohere API usage without parameter controls in ${relativeFile}`,
              recommendation: 'Add parameter controls like max_tokens, temperature to limit costs'
            });
          }
          
          if (!hasBudgetControl) {
            results.push({
              id: 'cohere-missing-budget-controls',
              name: 'Cohere API Missing Budget Controls',
              description: 'Cohere API usage detected without budget tracking mechanisms',
              location: {
                file: relativeFile,
                line: lineNumber,
                code: lineContent
              },
              severity: Severity.High,
              passed: false,
              details: `Cohere API usage without budget controls in ${relativeFile}`,
              recommendation: 'Implement token counting and budget tracking mechanisms to prevent unexpected costs'
            });
          }
        }
      }
      
      // If no AI API usage found
      if (openaiUsage === 0 && anthropicUsage === 0 && cohereUsage === 0) {
        results.push({
          id: 'ai-cost-controls',
          name: 'AI API Cost Controls Check',
          description: 'Check for missing cost controls when using AI APIs',
          location: {
            file: relativeFile,
            line: lineNumber,
            code: lineContent
          },
          severity: Severity.Medium,
          passed: true,
          details: `No AI API usage found in ${fileCount} scanned files`
        });
      } else if (results.length === 0) {
        // If AI APIs are used but no issues found
        results.push({
          id: 'ai-cost-controls',
          name: 'AI API Cost Controls Check',
          description: 'Check for missing cost controls when using AI APIs',
          location: {
            file: relativeFile,
            line: lineNumber,
            code: lineContent
          },
          severity: Severity.Medium,
          passed: true,
          details: `Found ${openaiUsage + anthropicUsage + cohereUsage} AI API usages with proper cost controls`
        });
      }
      
      return results;
    } catch (err) {
      logger.error(`Error during AI cost controls check: ${err}`);
      
      return [{
        id: 'ai-cost-controls-error',
        name: 'AI Cost Controls Check Error',
        description: 'An error occurred during the AI cost controls check',
        location: {
          file: '',
          line: 0,
          code: ''
        },
        severity: Severity.Medium,
        passed: false,
        details: `Error: ${err}`
      }];
    }
  }
}; 