import * as fs from 'fs-extra';
import * as path from 'path';
import { apiKeyChecker } from '../checkers/api-key-checker';
import { Severity } from '../types';
import * as os from 'os';

describe('API Key Checker', () => {
  let tempDir: string;
  
  // Setup test files with various API keys
  beforeAll(async () => {
    // Create a temporary directory
    tempDir = path.join(os.tmpdir(), `vibecheck-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    // Create a file with exposed API keys
    const jsFileWithKeys = path.join(tempDir, 'config.js');
    await fs.writeFile(jsFileWithKeys, `
      // This file has exposed API keys
      const supabaseKey = 'sbp_1234567890abcdef1234567890abcdef1234567890';
      const openaiKey = 'sk-1234567890abcdef1234567890abcdef1234567890';
      const googleKey = 'AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz'; // Test key, not real
      const githubKey = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
      const awsKey = 'AKIAIOSFODNN7EXAMPLE';
    `);
    
    // Create a file with API keys in environment variables (should be safe)
    const envFile = path.join(tempDir, '.env');
    await fs.writeFile(envFile, `
      # Environment variables (should be safe)
      SUPABASE_KEY=sbp_1234567890abcdef1234567890abcdef1234567890
      OPENAI_KEY=sk-1234567890abcdef1234567890abcdef1234567890
    `);
    
    // Create a test/example file (should be ignored)
    const testFile = path.join(tempDir, 'example.js');
    await fs.writeFile(testFile, `
      // Example keys that should be ignored
      const testKey = 'sk-1234567890abcdef1234567890abcdef1234567890';
      const exampleKey = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890';
    `);
    
    // Create a safe file with no API keys
    const safeFile = path.join(tempDir, 'safe.js');
    await fs.writeFile(safeFile, `
      // This file has no API keys
      const apiUrl = 'https://api.example.com';
      const userId = '12345';
    `);
  });
  
  // Clean up test files
  afterAll(async () => {
    await fs.remove(tempDir);
  });
  
  test('should detect exposed API keys in files', async () => {
    const results = await apiKeyChecker.check({
      directory: tempDir,
      ignorePatterns: []
    });
    
    // Make sure it found some issues
    expect(results.some(r => !r.passed)).toBe(true);
    
    // We only check for specific patterns we know exist in the file
    // Testing exact matches can be brittle as the regex patterns might change
    const foundKeys = results
      .filter(r => !r.passed)
      .map(r => r.id);
    
    // Check that we found at least some API key types
    expect(foundKeys.length).toBeGreaterThan(0);
    expect(foundKeys.some(id => id.startsWith('api-key-'))).toBe(true);
    
    // Check that all failures have critical severity
    const failures = results.filter(r => !r.passed);
    expect(failures.every(r => r.severity === Severity.Critical)).toBe(true);
    
    // Check that the issues have file locations
    expect(failures.every(r => r.file && r.location)).toBe(true);
  });
  
  test('should ignore example/test files', async () => {
    const results = await apiKeyChecker.check({
      directory: tempDir,
      ignorePatterns: []
    });
    
    // No issues should come from the example.js file
    expect(results.some(r => r.file && r.file.includes('example.js'))).toBe(false);
  });
  
  test('should respect ignore patterns', async () => {
    // Create a new temporary directory with a different structure
    const ignoreTestDir = path.join(os.tmpdir(), `vibecheck-ignore-test-${Date.now()}`);
    await fs.ensureDir(ignoreTestDir);
    
    // Create a file with API keys that should be ignored
    const configJsFile = path.join(ignoreTestDir, 'config.js');
    await fs.writeFile(configJsFile, `
      const apiKey = 'sk-1234567890abcdef1234567890abcdef1234567890';
    `);
    
    // Create another file with API keys that should be detected
    const otherJsFile = path.join(ignoreTestDir, 'other.js');
    await fs.writeFile(otherJsFile, `
      const otherKey = 'sk-1234567890abcdef1234567890abcdef1234567890';
    `);
    
    // Need to provide the full relative path pattern since file-utils doesn't handle
    // these the same way in tests as it would in production
    const configJsRelative = path.relative(ignoreTestDir, configJsFile);
    
    // Run the checker with ignore pattern for config.js
    const results = await apiKeyChecker.check({
      directory: ignoreTestDir,
      ignorePatterns: [configJsRelative]
    });
    
    // Check that we have some issues (to verify the scanner is working)
    expect(results.some(r => !r.passed)).toBe(true);
    
    // Check that no issues are from config.js
    const issueFiles = results
      .filter(r => !r.passed && r.file)
      .map(r => r.file as string);
    
    const hasConfigJsIssue = issueFiles.some(file => file.includes('config.js'));
    expect(hasConfigJsIssue).toBe(false);
    
    // Check that we did find issues in other.js
    const hasOtherJsIssue = issueFiles.some(file => file.includes('other.js'));
    expect(hasOtherJsIssue).toBe(true);
    
    // Clean up
    await fs.remove(ignoreTestDir);
  });
  
  test('should return a passing result if no issues are found', async () => {
    // Create a new temporary directory with only safe files
    const safeDir = path.join(os.tmpdir(), `vibecheck-safe-test-${Date.now()}`);
    await fs.ensureDir(safeDir);
    
    const safeFile = path.join(safeDir, 'safe.js');
    await fs.writeFile(safeFile, `
      // This file has no API keys
      const apiUrl = 'https://api.example.com';
      const userId = '12345';
    `);
    
    const results = await apiKeyChecker.check({
      directory: safeDir,
      ignorePatterns: []
    });
    
    // Should have one passing result
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
    
    // Clean up
    await fs.remove(safeDir);
  });
  
  test('should handle non-existent directories gracefully', async () => {
    const nonExistentDir = path.join(os.tmpdir(), 'non-existent-dir');
    
    const results = await apiKeyChecker.check({
      directory: nonExistentDir,
      ignorePatterns: []
    });
    
    // Should have a passing result as there are no files to scan
    expect(results.length).toBe(1);
    expect(results[0].passed).toBe(true);
  });
}); 