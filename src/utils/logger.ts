import chalk from 'chalk';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  NONE,
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

export function error(message: string): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.log(chalk.red(`[ERROR] ${message}`));
  }
}

export function success(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  }
}

export function header(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.bold.cyan(`\n${message}`));
  }
}

export function separator(): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(chalk.gray('─'.repeat(80)));
  }
} 