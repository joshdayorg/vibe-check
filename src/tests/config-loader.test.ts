import * as fs from 'fs-extra';
import * as path from 'path';
import { loadConfig, getSeverityOverride, isIssueIgnored } from '../utils/config-loader';
import { Severity } from '../types';

// Create temporary directory and files for testing
const setupTestFiles = async () => {
  const tempDir = path.join(__dirname, '__temp_config_test__');
  await fs.ensureDir(tempDir);
  
  // Create a config file in the temp directory
  const configFile = path.join(tempDir, 'vibecheck.config.json');
  const configContent = {
    ignorePatterns: ['**/ignored/**'],
    skipCheckers: ['test-checker'],
    severityOverrides: [
      { id: 'test-issue', severity: Severity.Critical }
    ],
    ignoreIssues: ['ignored-issue'],
    reportOptions: {
      format: 'html',
      showPassed: false
    }
  };
  
  await fs.writeFile(configFile, JSON.stringify(configContent));
  
  // Create a nested directory with another config
  const nestedDir = path.join(tempDir, 'nested');
  await fs.ensureDir(nestedDir);
  
  // Create an extending config - use absolute path to avoid loading issues
  const nestedConfigFile = path.join(nestedDir, '.vibecheckrc.json');
  const nestedConfigContent = {
    extends: path.resolve(tempDir, 'vibecheck.config.json'),
    ignorePatterns: ['**/extra-ignored/**']
  };
  
  await fs.writeFile(nestedConfigFile, JSON.stringify(nestedConfigContent));
  
  return { tempDir, nestedDir };
};

// Clean up test files
const cleanupTestFiles = async () => {
  const tempDir = path.join(__dirname, '__temp_config_test__');
  await fs.remove(tempDir);
};

describe('Configuration Loader', () => {
  let tempDir: string;
  let nestedDir: string;
  
  beforeAll(async () => {
    const dirs = await setupTestFiles();
    tempDir = dirs.tempDir;
    nestedDir = dirs.nestedDir;
  });
  
  afterAll(async () => {
    await cleanupTestFiles();
  });
  
  test('loadConfig should load configuration from directory', async () => {
    const config = await loadConfig(tempDir);
    
    expect(config).toBeDefined();
    expect(config?.ignorePatterns).toContain('**/ignored/**');
    expect(config?.skipCheckers).toContain('test-checker');
    expect(config?.reportOptions?.format).toBe('html');
  });
  
  test('loadConfig should load and merge extended configuration', async () => {
    const config = await loadConfig(nestedDir);
    
    expect(config).toBeDefined();
    expect(config?.ignorePatterns).toContain('**/ignored/**');
    expect(config?.ignorePatterns).toContain('**/extra-ignored/**');
    expect(config?.skipCheckers).toContain('test-checker');
    expect(config?.reportOptions?.format).toBe('html');
  });
  
  test('getSeverityOverride should return correct severity', () => {
    const config = {
      severityOverrides: [
        { id: 'test-issue', severity: Severity.Critical }
      ]
    };
    
    const severity = getSeverityOverride('test-issue', config);
    expect(severity).toBe(Severity.Critical);
    
    const nonExistingSeverity = getSeverityOverride('non-existing', config);
    expect(nonExistingSeverity).toBeUndefined();
  });
  
  test('isIssueIgnored should correctly identify ignored issues', () => {
    const config = {
      ignoreIssues: ['ignored-issue']
    };
    
    expect(isIssueIgnored('ignored-issue', config)).toBe(true);
    expect(isIssueIgnored('non-ignored-issue', config)).toBe(false);
  });
}); 