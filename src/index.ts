#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs-extra';
import { VibeCheck } from './vibecheck';
import { LogLevel, setLogLevel } from './utils/logger';
import { VibeCheckOptions } from './types';
import { version } from '../package.json';

// Create the CLI program
const program = new Command();

// Set up the CLI
program
  .name('vibecheck')
  .description('A security scanner for checking basic security practices in your codebase')
  .version(version);

// Default command (scan)
program
  .command('scan', { isDefault: true })
  .description('Scan the codebase for security issues')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-i, --ignore <patterns...>', 'Glob patterns to ignore')
  .option('-s, --skip <checkers...>', 'Checkers to skip')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-f, --format <format>', 'Output format (markdown, json, text)', 'markdown')
  .option('-o, --output <file>', 'Output file for the report')
  .option('--no-passed', 'Do not show passed checks in the report')
  .action(async (directory, options) => {
    try {
      // Set log level
      if (options.verbose) {
        setLogLevel(LogLevel.DEBUG);
      }
      
      // Resolve directory path
      const resolvedDir = path.resolve(process.cwd(), directory);
      
      // Create options for VibeCheck
      const vibeCheckOptions: VibeCheckOptions = {
        directory: resolvedDir,
        ignorePatterns: options.ignore || [],
        skipCheckers: options.skip || [],
        verbose: options.verbose || false,
        format: options.format,
        outputFile: options.output,
        showPassed: options.passed !== false
      };
      
      // Run the VibeCheck scanner
      const scanner = new VibeCheck(vibeCheckOptions);
      await scanner.run();
      
    } catch (err) {
      console.error(chalk.red(`Error: ${err}`));
      process.exit(1);
    }
  });

// Report command (generate a report from previous scan)
program
  .command('report')
  .description('Generate a report file from the last scan')
  .option('-f, --format <format>', 'Output format (markdown, json, text)', 'markdown')
  .option('-o, --output <file>', 'Output file for the report')
  .option('--no-passed', 'Do not show passed checks in the report')
  .action(async (options) => {
    console.log(chalk.yellow('The report command is not fully implemented yet.'));
    console.log('Please use the --output option with the scan command to generate a report.');
  });

// List command (list all available checkers)
program
  .command('list')
  .description('List all available checkers')
  .action(() => {
    console.log(chalk.cyan('Available checkers:'));
    console.log('');
    
    // Import checkers
    const { checkers } = require('./checkers');
    
    // Display each checker
    for (const checker of checkers) {
      console.log(chalk.bold(`${checker.id}:`));
      console.log(`  ${checker.description}`);
      console.log('');
    }
  });

// Parse command line arguments
program.parse(process.argv); 