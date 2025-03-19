import { CheckResult, Severity } from '../types';
import { getFiles, readFileContent } from '../utils/file-utils';
import { info } from '../utils/logger';

const AUTH_PATTERNS = {
  hardcodedCredentials: {
    pattern: /(const|let|var)\s+(password|secret|key|token|auth)\s*=\s*['"`][^'"`]+['"`]/i,
    message: 'Hardcoded credentials found',
    recommendation: 'Store credentials in environment variables'
  },
  plainTextPassword: {
    pattern: /password\s*===?\s*['"`][^'"`]+['"`]/,
    message: 'Plain text password comparison found',
    recommendation: 'Use secure password hashing and comparison'
  },
  missingAuth: {
    pattern: /(app\.(delete|put|post)|router\.(delete|put|post))\s*\([^)]*\)\s*=>\s*{(?![^}]*auth)/,
    message: 'Endpoint potentially missing authentication',
    recommendation: 'Add authentication middleware to protect endpoints'
  },
  weakPassword: {
    pattern: /minLength:\s*[1-7]\b|password.length\s*>=?\s*[1-7]\b/,
    message: 'Weak password policy found',
    recommendation: 'Implement strong password requirements (min 8 chars, special chars, etc.)'
  },
  tokenExposure: {
    pattern: /\b(jwt|token|auth)\b.*\b(url|query|params)\b/i,
    message: 'Authentication token potentially exposed in URL',
    recommendation: 'Use secure methods to transmit tokens (e.g., Authorization header)'
  },
  insecureSession: {
    pattern: /session\s*=\s*{[^}]*secure:\s*false|session\s*=\s*{[^}]*httpOnly:\s*false/,
    message: 'Insecure session configuration found',
    recommendation: 'Enable secure and httpOnly flags for sessions'
  }
};

const TARGET_FILES = [
  '**/route.ts',
  '**/api/**/*.ts',
  '**/auth/**/*.ts',
  '**/middleware.ts',
  '**/config.ts'
];

export async function check(directory: string): Promise<CheckResult[]> {
  info(`Scanning for authentication vulnerabilities in ${directory}...`);
  
  const results: CheckResult[] = [];
  const files = await getFiles(directory, TARGET_FILES);
  
  for (const file of files) {
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    for (const [key, check] of Object.entries(AUTH_PATTERNS)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (check.pattern.test(line)) {
          results.push({
            id: `auth-${key}`,
            name: 'Authentication Security Issue',
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
      id: 'auth-check',
      name: 'Authentication Security Check',
      description: 'Check for authentication vulnerabilities',
      severity: Severity.Critical,
      passed: true,
      details: `No authentication vulnerabilities found in ${files.length} files`
    });
  }
  
  return results;
} 