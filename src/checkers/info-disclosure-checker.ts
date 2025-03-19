import { CheckResult, Severity } from '../types';
import { getFiles, readFileContent } from '../utils/file-utils';
import { info } from '../utils/logger';

const DISCLOSURE_PATTERNS = {
  sensitiveHeaders: {
    pattern: /res\.header\s*\(\s*['"`](Server|X-Powered-By|X-AspNet-Version|X-AspNetMvc-Version)['"`]|app\.disable\s*\(\s*['"`]x-powered-by['"`]\s*\)/i,
    message: 'Sensitive headers exposed',
    recommendation: 'Remove or mask sensitive headers that reveal technology stack'
  },
  errorDetails: {
    pattern: /res\.status\s*\(\s*\d+\s*\)\.send\s*\(\s*error|res\.status\s*\(\s*\d+\s*\)\.json\s*\(\s*{\s*error|throw\s+new\s+Error\s*\([^)]*\)/,
    message: 'Detailed error information potentially exposed',
    recommendation: 'Use generic error messages in production'
  },
  sensitiveData: {
    pattern: /(password|secret|key|token|auth|credit|ssn|social|private).*?:\s*['"`][^'"`]+['"`]/i,
    message: 'Sensitive data potentially exposed',
    recommendation: 'Ensure sensitive data is not logged or exposed in responses'
  },
  stackTrace: {
    pattern: /console\.(log|error)\s*\(\s*error|error\.stack|new\s+Error\s*\([^)]*\)\.stack/,
    message: 'Stack trace potentially exposed',
    recommendation: 'Remove stack traces in production responses'
  },
  versionInfo: {
    pattern: /version:\s*['"`][0-9.]+['"`]|v[0-9.]+|package\.json|version\.txt/i,
    message: 'Version information exposed',
    recommendation: 'Remove or mask version information in responses'
  },
  internalPaths: {
    pattern: /__dirname|process\.cwd\(\)|path\.resolve\s*\(|require\.resolve\s*\(/,
    message: 'Internal file paths potentially exposed',
    recommendation: 'Avoid exposing internal file paths in responses'
  },
  debugInfo: {
    pattern: /console\.(log|debug|info)|debug:\s*true|isDev|isDevelopment/,
    message: 'Debug information potentially exposed',
    recommendation: 'Remove debug logging in production'
  }
};

const TARGET_FILES = [
  '**/route.ts',
  '**/api/**/*.ts',
  '**/middleware/**/*.ts',
  '**/error/**/*.ts',
  '**/handlers/**/*.ts',
  '**/config/**/*.ts'
];

export async function check(directory: string): Promise<CheckResult[]> {
  info(`Scanning for information disclosure vulnerabilities in ${directory}...`);
  
  const results: CheckResult[] = [];
  const files = await getFiles(directory, TARGET_FILES);
  
  for (const file of files) {
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    for (const [key, check] of Object.entries(DISCLOSURE_PATTERNS)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (check.pattern.test(line)) {
          results.push({
            id: `disclosure-${key}`,
            name: 'Information Disclosure Issue',
            description: check.message,
            severity: Severity.High,
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
      id: 'disclosure-check',
      name: 'Information Disclosure Check',
      description: 'Check for information disclosure vulnerabilities',
      severity: Severity.High,
      passed: true,
      details: `No information disclosure vulnerabilities found in ${files.length} files`
    });
  }
  
  return results;
} 