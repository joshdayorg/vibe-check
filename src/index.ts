#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { VibeCheck } from './vibecheck';
import { LogLevel, setLogLevel } from './utils/logger';
import { VibeCheckOptions, ReportFormat } from './types';

// Create the CLI program
const program = new Command();

// Set up the CLI
program
  .name('vibecheck')
  .description('A security scanner for modern web applications')
  .version('0.2.0');

// Default command (scan)
program
  .command('scan', { isDefault: true })
  .description('Scan the codebase for security issues')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-i, --ignore <patterns...>', 'Glob patterns to ignore')
  .option('-s, --skip <checkers...>', 'Checkers to skip')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-o, --output <file>', 'Output file for the report')
  .option('-f, --format <format>', 'Report format (text, json, markdown, html)', 'markdown')
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
        outputFile: options.output,
        showPassed: options.passed !== false,
        format: options.format as ReportFormat
      };
      
      // Run the VibeCheck scanner
      const scanner = new VibeCheck(vibeCheckOptions);
      await scanner.run();
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  });

// List command (list all available checkers)
program
  .command('list')
  .description('List all available checkers')
  .action(() => {
    console.log('Available checkers:');
    console.log('');
    
    // Import checkers
    const { allCheckers } = require('./checkers');
    
    // Display each checker
    for (const checker of allCheckers) {
      console.log(`${checker.id}:`);
      console.log(`  ${checker.description}`);
      console.log('');
    }
  });

// Parse command line arguments
program.parse(); 