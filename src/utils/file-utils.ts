import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import { createGitignoreFilter } from 'glob-gitignore';
import * as os from 'os';

/**
 * Get all files in a directory matching patterns and respecting gitignore
 */
export async function getFiles(
  directory: string,
  patterns: string[] = ['**/*'],
  ignorePatterns: string[] = []
): Promise<string[]> {
  // Make sure directory exists
  if (!await fs.pathExists(directory)) {
    throw new Error(`Directory ${directory} does not exist`);
  }

  // Add default ignore patterns
  const defaultIgnores = [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
  ];
  
  const allIgnores = [...defaultIgnores, ...ignorePatterns];
  
  // Check if .gitignore exists
  const gitignorePath = path.join(directory, '.gitignore');
  let gitignoreFilter = null;
  
  if (await fs.pathExists(gitignorePath)) {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    gitignoreFilter = createGitignoreFilter(gitignoreContent);
  }
  
  // Gather all files
  let files: string[] = [];
  
  for (const pattern of patterns) {
    try {
      const matchedFiles = glob.sync(pattern, {
        cwd: directory,
        ignore: allIgnores,
        absolute: true,
        nodir: true,
      });
      
      files = [...files, ...matchedFiles];
    } catch (error) {
      console.error(`Error globbing pattern ${pattern}: ${error}`);
    }
  }
  
  // Filter by gitignore if available
  if (gitignoreFilter) {
    files = files.filter(file => {
      const relativePath = path.relative(directory, file);
      return !gitignoreFilter(relativePath);
    });
  }
  
  return files;
}

/**
 * Find files matching pattern with error handling
 */
export async function findFiles(
  directory: string,
  patterns: string[]
): Promise<string[]> {
  try {
    return await getFiles(directory, patterns);
  } catch (error) {
    console.error(`Error finding files: ${error}`);
    return [];
  }
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
  try {
    if (await fs.pathExists(file)) {
      return await fs.readFile(file, 'utf8');
    }
    console.error(`File ${file} does not exist`);
    return '';
  } catch (error) {
    console.error(`Error reading file ${file}: ${error}`);
    return '';
  }
}

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectory(directory: string): Promise<void> {
  try {
    await fs.ensureDir(directory);
  } catch (error) {
    console.error(`Error creating directory ${directory}: ${error}`);
    throw error;
  }
}

/**
 * Write file with directory creation
 */
export async function writeFile(file: string, content: string): Promise<void> {
  try {
    // Ensure parent directory exists
    await ensureDirectory(path.dirname(file));
    await fs.writeFile(file, content);
  } catch (error) {
    console.error(`Error writing file ${file}: ${error}`);
    throw error;
  }
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
  try {
    const buffer = await fs.readFile(file);
    
    // Check for NULL bytes in the first 1024 bytes
    for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
      if (buffer[i] === 0) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
} 