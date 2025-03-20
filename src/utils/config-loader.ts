import * as fs from 'fs-extra';
import * as path from 'path';
import { ConfigFile, Severity } from '../types';
import * as logger from './logger';

const CONFIG_FILE_NAMES = [
  'vibecheck.config.js',
  'vibecheck.config.json',
  '.vibecheckrc',
  '.vibecheckrc.json',
  '.vibecheckrc.js'
];

/**
 * Load configuration from a file
 */
export async function loadConfig(directory: string): Promise<ConfigFile | undefined> {
  try {
    // Look for config file in directory and parent directories
    const configPath = await findConfigFile(directory);
    
    if (!configPath) {
      logger.debug('No configuration file found');
      return undefined;
    }
    
    logger.debug(`Loading configuration from ${configPath}`);
    
    // Parse config based on file extension
    const config = await parseConfigFile(configPath);
    
    // Handle 'extends' property if present
    if (config.extends) {
      const baseConfig = await loadExtendedConfig(config.extends, path.dirname(configPath));
      if (baseConfig) {
        return mergeConfigs(baseConfig, config);
      }
    }
    
    return config;
  } catch (err) {
    logger.error(
      `Error loading configuration: ${err}`, 
      logger.ErrorCategory.CONFIG, 
      err as Error
    );
    return undefined;
  }
}

/**
 * Find config file by searching in directory and parent directories
 */
async function findConfigFile(startDir: string): Promise<string | undefined> {
  let currentDir = startDir;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check each possible config file name
    for (const fileName of CONFIG_FILE_NAMES) {
      const filePath = path.join(currentDir, fileName);
      
      if (await fs.pathExists(filePath)) {
        return filePath;
      }
    }
    
    // Move to parent directory
    const parentDir = path.dirname(currentDir);
    
    // Stop if we've reached the root
    if (parentDir === currentDir) {
      break;
    }
    
    currentDir = parentDir;
  }
  
  return undefined;
}

/**
 * Parse config file based on file extension
 */
async function parseConfigFile(filePath: string): Promise<ConfigFile> {
  const ext = path.extname(filePath);
  
  if (ext === '.js' || ext === '') {
    // For .js or no extension, try to require it
    try {
      // Note: In a real implementation, you might want to use something
      // like import() but it requires additional configuration
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(filePath) as ConfigFile;
    } catch (err) {
      throw new Error(`Failed to load JavaScript config file: ${err}`);
    }
  } else if (ext === '.json') {
    // For .json, parse JSON
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as ConfigFile;
    } catch (err) {
      throw new Error(`Failed to parse JSON config file: ${err}`);
    }
  } else {
    throw new Error(`Unsupported config file extension: ${ext}`);
  }
}

/**
 * Load a configuration that is extended by another
 */
async function loadExtendedConfig(
  extendsPath: string,
  baseDir: string
): Promise<ConfigFile | undefined> {
  try {
    // Handle built-in configs
    if (extendsPath.startsWith('vibecheck:')) {
      const builtinName = extendsPath.substring('vibecheck:'.length);
      return loadBuiltinConfig(builtinName);
    }
    
    // Handle relative paths
    const resolvedPath = path.isAbsolute(extendsPath)
      ? extendsPath
      : path.resolve(baseDir, extendsPath);
    
    if (await fs.pathExists(resolvedPath)) {
      return parseConfigFile(resolvedPath);
    }
    
    // Handle npm packages (would need more complex logic in a real implementation)
    
    throw new Error(`Extended config not found: ${extendsPath}`);
  } catch (err) {
    logger.error(
      `Error loading extended configuration: ${err}`,
      logger.ErrorCategory.CONFIG,
      err as Error
    );
    return undefined;
  }
}

/**
 * Load a built-in configuration
 */
function loadBuiltinConfig(name: string): ConfigFile | undefined {
  // Define built-in configurations
  const builtins: Record<string, ConfigFile> = {
    'recommended': {
      // Default recommended settings
      severityOverrides: [
        { id: 'api-key-checker', severity: Severity.Critical },
        { id: 'jwt-storage-checker', severity: Severity.Critical },
        { id: 'cors-checker', severity: Severity.High }
      ]
    },
    'strict': {
      // More strict settings
      severityOverrides: [
        { id: 'api-key-checker', severity: Severity.Critical },
        { id: 'jwt-storage-checker', severity: Severity.Critical },
        { id: 'cors-checker', severity: Severity.Critical },
        { id: 'insecure-cookies-checker', severity: Severity.Critical }
      ]
    },
    'next': {
      // Next.js specific settings
      checkerOptions: {
        nextJs: {
          checkPublicEnv: true
        }
      }
    },
    'supabase': {
      // Supabase specific settings
      checkerOptions: {
        supabase: {
          checkRls: true,
          checkStorage: true
        }
      }
    }
  };
  
  return builtins[name];
}

/**
 * Merge two configurations
 */
function mergeConfigs(base: ConfigFile, override: ConfigFile): ConfigFile {
  return {
    ...base,
    ...override,
    // Deep merge arrays and objects
    ignorePatterns: [...(base.ignorePatterns || []), ...(override.ignorePatterns || [])],
    skipCheckers: [...(base.skipCheckers || []), ...(override.skipCheckers || [])],
    severityOverrides: [...(base.severityOverrides || []), ...(override.severityOverrides || [])],
    ignoreIssues: [...(base.ignoreIssues || []), ...(override.ignoreIssues || [])],
    reportOptions: {
      ...(base.reportOptions || {}),
      ...(override.reportOptions || {})
    },
    checkerOptions: {
      ...(base.checkerOptions || {}),
      ...(override.checkerOptions || {})
    }
  };
}

/**
 * Get a severity override if it exists
 */
export function getSeverityOverride(
  id: string,
  config?: ConfigFile
): Severity | undefined {
  if (!config?.severityOverrides) {
    return undefined;
  }
  
  const override = config.severityOverrides.find(o => o.id === id);
  return override?.severity;
}

/**
 * Check if an issue should be ignored
 */
export function isIssueIgnored(id: string, config?: ConfigFile): boolean {
  return !!config?.ignoreIssues?.includes(id);
} 