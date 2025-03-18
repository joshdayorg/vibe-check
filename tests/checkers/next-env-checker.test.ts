import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { nextPublicEnvChecker } from '../../src/checkers/next/public-env-checker';

describe('Next.js Public ENV Checker', () => {
  let tempDir: string;
  
  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `vibecheck-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
  });
  
  afterEach(async () => {
    // Clean up the temporary directory
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });
  
  test('should pass when no env files exist', async () => {
    const results = await nextPublicEnvChecker.check({ directory: tempDir });
    
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].id).toBe('next-public-env');
  });
  
  test('should detect sensitive data in NEXT_PUBLIC_ variables', async () => {
    // Create a test .env file with sensitive data
    const envFilePath = path.join(tempDir, '.env.local');
    await fs.writeFile(envFilePath, 'NEXT_PUBLIC_SUPABASE_KEY=sbp_1234567890abcdefghijklmn');
    
    const results = await nextPublicEnvChecker.check({ directory: tempDir });
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result => !result.passed)).toBe(true);
    expect(results.some(result => result.id === 'next-public-env-exposed')).toBe(true);
    
    // Find the failing result
    const failingResult = results.find(result => !result.passed);
    expect(failingResult?.severity).toBe('critical');
  });
  
  test('should ignore regular environment variables', async () => {
    // Create a test .env file with regular variables
    const envFilePath = path.join(tempDir, '.env');
    await fs.writeFile(envFilePath, 'SUPABASE_KEY=sbp_1234567890abcdefghijklmn\nAPIKEY=secret123');
    
    const results = await nextPublicEnvChecker.check({ directory: tempDir });
    
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
  });
}); 