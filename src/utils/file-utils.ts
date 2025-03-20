import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import { createGitignoreFilter } from 'glob-gitignore';
import * as os from 'os';
import * as logger from './logger';

/**
 * Get all files in a directory matching patterns and respecting gitignore
 */
export async function getFiles(directory: string, patterns: string[]): Promise<string[]> {
  return await logger.safeAsync(
    async () => {
      const options = {
        cwd: directory,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        nodir: true
      };
      
      const allFiles: string[] = [];
      for (const pattern of patterns) {
        const files = glob.sync(pattern, options);
        allFiles.push(...files.map(f => path.join(directory, f)));
      }
      return allFiles;
    },
    `Error finding files in directory: ${directory}`,
    logger.ErrorCategory.FILE_ACCESS,
    []
  ) || [];
}

/**
 * Find files matching pattern with error handling
 */
export async function findFiles(
  directory: string,
  patterns: string[]
): Promise<string[]> {
  return await logger.safeAsync(
    async () => getFiles(directory, patterns),
    `Error finding files matching patterns in directory: ${directory}`,
    logger.ErrorCategory.FILE_ACCESS,
    []
  ) || [];
}

/**
 * Find Next.js environment files with error handling
 */
export async function findEnvFiles(directory: string): Promise<string[]> {
  return findFiles(directory, [
    '**/.env',
    '**/.env.local',
    '**/.env.development',
    '**/.env.production',
    '**/next.config.js',
    '**/next.config.ts'
  ]);
}

/**
 * Find SQL files with error handling
 */
export async function findSqlFiles(directory: string): Promise<string[]> {
  return findFiles(directory, [
    '**/*.sql',
    '**/migrations/**/*.js',
    '**/migrations/**/*.ts'
  ]);
}

/**
 * Read file content with error handling
 */
export async function readFile(file: string): Promise<string> {
  return await logger.safeAsync(
    async () => {
      if (await fs.pathExists(file)) {
        return await fs.readFile(file, 'utf8');
      }
      logger.warn(`File ${file} does not exist`);
      return '';
    },
    `Error reading file: ${file}`,
    logger.ErrorCategory.FILE_ACCESS,
    ''
  ) || '';
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(directory: string): Promise<void> {
  await logger.safeAsync(
    async () => fs.ensureDir(directory),
    `Error creating directory: ${directory}`,
    logger.ErrorCategory.FILE_ACCESS
  );
}

/**
 * Write file with directory creation
 */
export async function writeFile(file: string, content: string): Promise<void> {
  await logger.safeAsync(
    async () => {
      // Ensure parent directory exists
      await ensureDirectory(path.dirname(file));
      await fs.writeFile(file, content);
    },
    `Error writing file: ${file}`,
    logger.ErrorCategory.FILE_ACCESS
  );
}

/**
 * Get file content with line numbers
 */
export function getFileContentWithLineNumbers(
  content: string
): { line: number; content: string }[] {
  return content.split(/\r?\n/).map((line, index) => ({
    line: index + 1,
    content: line,
  }));
}

/**
 * Check if a file is a text file (not binary)
 */
export async function isTextFile(file: string): Promise<boolean> {
  return await logger.safeAsync(
    async () => {
      const buffer = await fs.readFile(file);
      
      // Check for NULL bytes in the first 1024 bytes
      for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
        if (buffer[i] === 0) {
          return false;
        }
      }
      
      return true;
    },
    `Error checking if file is text: ${file}`,
    logger.ErrorCategory.FILE_ACCESS,
    false
  ) || false;
}

/**
 * Read file content with enhanced error handling
 */
export async function readFileContent(filePath: string): Promise<string> {
  return await logger.safeAsync(
    async () => fs.readFile(filePath, 'utf8'),
    `Error reading file content: ${filePath}`,
    logger.ErrorCategory.FILE_ACCESS,
    ''
  ) || '';
} 