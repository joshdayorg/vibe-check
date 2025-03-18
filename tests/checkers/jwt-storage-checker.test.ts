import * as path from 'path';
import * as fs from 'fs-extra';
import { jwtStorageChecker } from '../../src/checkers/jwt-storage-checker';

// Create temporary test directory
const TEST_DIR = path.join(__dirname, '__temp_jwt_test__');

// Sample files with JWT storage issues
const INSECURE_JWT_FILE = `
// This is an insecure JWT storage example
function storeJwtToken(token) {
  localStorage.setItem('jwt', token);
}

function getJwtToken() {
  return localStorage.getItem('jwt');
}
`;

const SECURE_JWT_FILE = `
// This is a secure JWT storage example
function storeJwtToken(token) {
  // Use httpOnly cookies instead of localStorage
  document.cookie = 'authorization=' + token + '; path=/; secure; httpOnly; sameSite=strict';
}

function getJwtToken() {
  // Parse cookie for auth token
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'authorization') {
      return value;
    }
  }
  return null;
}
`;

describe('JWT Storage Checker', () => {
  beforeAll(async () => {
    // Create test directory
    await fs.ensureDir(TEST_DIR);
    
    // Create test files
    await fs.writeFile(path.join(TEST_DIR, 'insecure.js'), INSECURE_JWT_FILE);
    await fs.writeFile(path.join(TEST_DIR, 'secure.js'), SECURE_JWT_FILE);
  });
  
  afterAll(async () => {
    // Clean up test directory
    await fs.remove(TEST_DIR);
  });
  
  it('should detect insecure JWT storage in localStorage', async () => {
    const results = await jwtStorageChecker.check({ directory: TEST_DIR });
    
    // Check that issues were found
    const failures = results.filter(result => !result.passed);
    expect(failures.length).toBeGreaterThan(0);
    
    // Verify the issue details
    const jwtStorageIssue = failures.find(result => result.id === 'jwt-local-storage');
    expect(jwtStorageIssue).toBeDefined();
    expect(jwtStorageIssue?.severity).toBe('high');
    expect(jwtStorageIssue?.file).toContain('insecure.js');
  });
  
  it('should not report issues in files with secure JWT handling', async () => {
    // Create a directory with only the secure file
    const secureDir = path.join(TEST_DIR, 'secure');
    await fs.ensureDir(secureDir);
    await fs.writeFile(path.join(secureDir, 'secure.js'), SECURE_JWT_FILE);
    
    const results = await jwtStorageChecker.check({ directory: secureDir });
    
    // Verify no failures were found
    const failures = results.filter(result => !result.passed);
    expect(failures.length).toBe(0);
    
    // Clean up
    await fs.remove(secureDir);
  });
}); 