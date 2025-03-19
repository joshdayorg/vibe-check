import { CheckResult, Severity } from '../types';
import { getFiles, readFileContent } from '../utils/file-utils';
import { info } from '../utils/logger';

const VALIDATION_PATTERNS = {
  sqlInjection: {
    pattern: /`SELECT.*?\$\{.*?\}|`INSERT.*?\$\{.*?\}|`UPDATE.*?\$\{.*?\}|`DELETE.*?\$\{.*?\}|\.query\s*\(\s*['"`][^'"`]*\$\{/i,
    message: 'Potential SQL injection vulnerability',
    recommendation: 'Use parameterized queries or an ORM'
  },
  unsafeEval: {
    pattern: /eval\s*\(.*?\$\{.*?\}|new\s+Function\s*\(.*?\$\{.*?\}|setTimeout\s*\(\s*['"`].*?\$\{.*?\}/,
    message: 'Unsafe dynamic code execution',
    recommendation: 'Avoid using eval() with user input'
  },
  noValidation: {
    pattern: /req\.body\.[a-zA-Z_$][a-zA-Z0-9_$]*|req\.query\.[a-zA-Z_$][a-zA-Z0-9_$]*|req\.params\.[a-zA-Z_$][a-zA-Z0-9_$]*/,
    message: 'Direct use of request parameters without validation',
    recommendation: 'Validate and sanitize all user input'
  },
  commandInjection: {
    pattern: /exec\s*\(\s*['"`][^'"`]*\$\{.*?\}|spawn\s*\(\s*['"`][^'"`]*\$\{.*?\}/,
    message: 'Potential command injection vulnerability',
    recommendation: 'Validate and escape command parameters'
  },
  pathTraversal: {
    pattern: /\b(fs|path)\b.*?\$\{.*?(req|params|query|body).*?\}/,
    message: 'Potential path traversal vulnerability',
    recommendation: 'Validate and sanitize file paths'
  },
  unsafeRegex: {
    pattern: /new\s+RegExp\s*\(\s*['"`][^'"`]*\$\{.*?\}/,
    message: 'Dynamic regular expression creation',
    recommendation: 'Validate and escape regex patterns'
  },
  unsafeDeserialization: {
    pattern: /JSON\.parse\s*\(\s*.*?(req|body|params|query)|deserialize\s*\(\s*.*?(req|body|params|query)/,
    message: 'Unsafe deserialization of user input',
    recommendation: 'Validate JSON schema before parsing'
  }
};

const TARGET_FILES = [
  '**/route.ts',
  '**/api/**/*.ts',
  '**/controllers/**/*.ts',
  '**/handlers/**/*.ts',
  '**/middleware/**/*.ts'
];

export async function check(directory: string): Promise<CheckResult[]> {
  info(`Scanning for input validation vulnerabilities in ${directory}...`);
  
  const results: CheckResult[] = [];
  const files = await getFiles(directory, TARGET_FILES);
  
  for (const file of files) {
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    for (const [key, check] of Object.entries(VALIDATION_PATTERNS)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (check.pattern.test(line)) {
          results.push({
            id: `validation-${key}`,
            name: 'Input Validation Issue',
            description: check.message,
            severity: Severity.Critical,
            passed: false,
            details: `Found in ${file}:${i + 1}\nCode:\n${line.trim()}\nRecommendation: ${check.recommendation}`,
            location: {
              file,
              line: i + 1,
              code: line.trim()
            }
          });
        }
      }
    }
  }
  
  if (results.length === 0) {
    results.push({
      id: 'validation-check',
      name: 'Input Validation Check',
      description: 'Check for input validation vulnerabilities',
      severity: Severity.Critical,
      passed: true,
      details: `No input validation vulnerabilities found in ${files.length} files`
    });
  }
  
  return results;
} 