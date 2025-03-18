import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { apiKeyChecker } from '../../src/checkers/api-key-checker';

describe('API Key Checker', () => {
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
  
  test('should pass when no code files exist', async () => {
    const results = await apiKeyChecker.check({ directory: tempDir });
    
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].id).toBe('api-key-exposure');
  });
  
  test('should detect hardcoded OpenAI API key', async () => {
    // Create a test JS file with hardcoded API key
    const filePath = path.join(tempDir, 'config.js');
    await fs.writeFile(filePath, 'const apiKey = "sk-1234567890abcdefghijklmnopqrstuvwxyz";');
    
    const results = await apiKeyChecker.check({ directory: tempDir });
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result => !result.passed)).toBe(true);
    expect(results.some(result => result.id.includes('api-key-openai'))).toBe(true);
  });
  
  test('should detect hardcoded Supabase key', async () => {
    // Create a test JS file with hardcoded Supabase key - match the exact pattern
    const filePath = path.join(tempDir, 'config.js');
    await fs.writeFile(filePath, 'const supabaseKey = "sbp_123456789012345678901234567890123456789012";');
    
    const results = await apiKeyChecker.check({ directory: tempDir });
    
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(result => !result.passed)).toBe(true);
    expect(results.some(result => result.id.includes('api-key-supabase'))).toBe(true);
  });
  
  test('should ignore API keys in test files', async () => {
    // Create a test file that mentions it's for testing
    const filePath = path.join(tempDir, 'test-config.js');
    await fs.writeFile(
      filePath, 
      '// This is a test file\n' +
      'const fakeApiKey = "sk-1234567890abcdefghijklmnopqrstuvwxyz"; // example key'
    );
    
    const results = await apiKeyChecker.check({ directory: tempDir });
    
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
  });
}); 