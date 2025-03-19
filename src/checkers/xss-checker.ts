import { CheckResult, Severity } from '../types';
import { getFiles, readFileContent } from '../utils/file-utils';
import { info } from '../utils/logger';

const XSS_PATTERNS = {
  dangerousHTML: {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{.*?\}/,
    message: 'Usage of dangerouslySetInnerHTML found',
    recommendation: 'Use safe content rendering methods instead of dangerouslySetInnerHTML'
  },
  innerHTML: {
    pattern: /\.(innerHTML|outerHTML)\s*=/,
    message: 'Direct DOM manipulation via innerHTML/outerHTML',
    recommendation: 'Use safe DOM manipulation methods or React state management'
  },
  unsafeIframe: {
    pattern: /<iframe[^>]*src\s*=\s*[{"`'].*?[}`'"]/i,
    message: 'Potentially unsafe iframe src found',
    recommendation: 'Validate and sanitize iframe sources, use sandbox attribute'
  },
  unsafeStyle: {
    pattern: /style\s*=\s*\{.*?}/,
    message: 'Dynamic style injection found',
    recommendation: 'Use CSS classes or styled-components instead of dynamic styles'
  },
  eval: {
    pattern: /\b(eval|Function|setTimeout|setInterval)\s*\(\s*("|'|`)/,
    message: 'Potentially unsafe code execution via eval or similar functions',
    recommendation: 'Avoid using eval() and similar functions that execute strings as code'
  },
  documentWrite: {
    pattern: /document\.(write|writeln)\s*\(/,
    message: 'Usage of document.write found',
    recommendation: 'Use safe DOM manipulation methods instead of document.write'
  },
  rawHtml: {
    pattern: /__html:\s*["`'].*?["`']/,
    message: 'Raw HTML injection found',
    recommendation: 'Use safe content rendering methods instead of raw HTML'
  }
};

const TARGET_FILES = [
  '**/*.tsx',
  '**/*.jsx',
  '**/*.ts',
  '**/*.js',
  '**/*.html'
];

export async function check(directory: string): Promise<CheckResult[]> {
  info(`Scanning for XSS vulnerabilities in ${directory}...`);
  
  const results: CheckResult[] = [];
  const files = await getFiles(directory, TARGET_FILES);
  
  for (const file of files) {
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    for (const [key, check] of Object.entries(XSS_PATTERNS)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (check.pattern.test(line)) {
          results.push({
            id: `xss-${key}`,
            name: 'Cross-Site Scripting (XSS) Vulnerability',
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
      id: 'xss-check',
      name: 'Cross-Site Scripting (XSS) Check',
      description: 'Check for potential XSS vulnerabilities',
      severity: Severity.Critical,
      passed: true,
      details: `No XSS vulnerabilities found in ${files.length} files`
    });
  }
  
  return results;
} 