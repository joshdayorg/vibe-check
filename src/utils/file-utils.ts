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
    const matchedFiles = glob.sync(pattern, {
      cwd: directory,
      ignore: allIgnores,
      absolute: true,
      nodir: true,
    });
    
    files = [...files, ...matchedFiles];
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
 * Read file content
 */
export async function readFile(file: string): Promise<string> {
  return fs.readFile(file, 'utf8');
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