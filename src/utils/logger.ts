import chalk from 'chalk';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE,
}

// Error categories for better error handling
export enum ErrorCategory {
  FILE_ACCESS = 'FILE_ACCESS',
  CONFIG = 'CONFIG',
  CHECKER = 'CHECKER',
  REPORT = 'REPORT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

let currentLogLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function debug(message: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(chalk.gray(`[DEBUG] ${message}`));
  }
}

export function info(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.white(`[INFO] ${message}`));
  }
}

export function warn(message: string): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.log(chalk.yellow(`[WARNING] ${message}`));
  }
}

export function error(message: string, category: ErrorCategory = ErrorCategory.UNKNOWN, err?: Error): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.log(chalk.red(`[ERROR][${category}] ${message}`));
    
    // Log stack trace in debug mode
    if (currentLogLevel === LogLevel.DEBUG && err?.stack) {
      console.log(chalk.red(err.stack));
    }
  }
}

export function success(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }
}

export function header(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log('');
    console.log(chalk.bold.cyan(message));
    console.log(chalk.cyan('='.repeat(message.length)));
  }
}

export function separator(): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.gray('----------------------------------------'));
  }
}

// Helper for safe error handling
export function safeOperation<T>(
  operation: () => T,
  errorMessage: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  defaultValue?: T
): T | undefined {
  try {
    return operation();
  } catch (err) {
    error(errorMessage, category, err as Error);
    return defaultValue;
  }
}

// Helper for safe async operations
export async function safeAsync<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (err) {
    error(errorMessage, category, err as Error);
    return defaultValue;
  }
} 