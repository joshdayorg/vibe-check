import { CheckResult, Severity } from '../types';
import { getFiles, readFileContent } from '../utils/file-utils';
import { info } from '../utils/logger';

const CONFIG_PATTERNS = {
  disabledSSL: {
    pattern: /ssl:\s*false|rejectUnauthorized:\s*false|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0['"]?/,
    message: 'SSL/TLS verification disabled',
    recommendation: 'Enable SSL/TLS verification for secure connections'
  },
  debugMode: {
    pattern: /debug:\s*true|NODE_ENV\s*=\s*['"]development['"]|isDevelopment:\s*true/,
    message: 'Debug mode potentially enabled in production',
    recommendation: 'Ensure debug mode is disabled in production environments'
  },
  exposedEndpoints: {
    pattern: /(internal|admin|debug|test).*?(url|endpoint|api).*?['"](https?:\/\/|\/)[^'"]+['"]|baseUrl.*?['"](https?:\/\/|\/)[^'"]+['"]|apiUrl.*?['"](https?:\/\/|\/)[^'"]+['"]/i,
    message: 'Internal endpoints potentially exposed',
    recommendation: 'Move internal endpoints behind proper authentication and authorization'
  },
  insecureCookies: {
    pattern: /cookie.*?secure:\s*false|cookie.*?httpOnly:\s*false|sameSite:\s*['"]none['"]|maxAge:\s*[0-9]+/,
    message: 'Insecure cookie configuration',
    recommendation: 'Enable secure, httpOnly flags and set appropriate sameSite policy'
  },
  corsAll: {
    pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"]?\*['"]?\s*\}|Access-Control-Allow-Origin:\s*\*/,
    message: 'CORS configured to allow all origins',
    recommendation: 'Restrict CORS to specific trusted origins'
  },
  exposedErrors: {
    pattern: /stackTrace|error\.stack|console\.(log|error)\s*\(.*?error/,
    message: 'Potential exposure of error details',
    recommendation: 'Implement proper error handling and logging without exposing internal details'
  },
  weakCrypto: {
    pattern: /crypto.*?md5|crypto.*?sha1|createHash\s*\(\s*['"]md5['"]|createHash\s*\(\s*['"]sha1['"]/,
    message: 'Usage of weak cryptographic algorithms',
    recommendation: 'Use strong cryptographic algorithms (SHA-256 or better)'
  }
};

const TARGET_FILES = [
  '**/config.ts',
  '**/config.js',
  '**/settings.ts',
  '**/settings.js',
  '**/middleware.ts',
  '**/server.ts',
  '**/*.config.ts',
  '**/*.config.js'
];

export async function check(directory: string): Promise<CheckResult[]> {
  info(`Scanning for insecure configurations in ${directory}...`);
  
  const results: CheckResult[] = [];
  const files = await getFiles(directory, TARGET_FILES);
  
  for (const file of files) {
    const content = await readFileContent(file);
    const lines = content.split('\n');
    
    for (const [key, check] of Object.entries(CONFIG_PATTERNS)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (check.pattern.test(line)) {
          results.push({
            id: `config-${key}`,
            name: 'Configuration Security Issue',
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
      id: 'config-check',
      name: 'Configuration Security Check',
      description: 'Check for insecure configurations',
      severity: Severity.Critical,
      passed: true,
      details: `No configuration vulnerabilities found in ${files.length} files`
    });
  }
  
  return results;
} 