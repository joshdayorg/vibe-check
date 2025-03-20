#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { VibeCheck } from './vibecheck';
import { LogLevel, setLogLevel } from './utils/logger';
import { VibeCheckOptions, ReportFormat } from './types';
import { loadConfig } from './utils/config-loader';

// Create the CLI program
const program = new Command();

// Set up the CLI
program
  .name('vibecheck')
  .description('A security scanner for modern web applications')
  .version('0.2.1');

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
  .option('-c, --config <file>', 'Path to config file')
  .action(async (directory, options) => {
    try {
      // Set log level
      if (options.verbose) {
        setLogLevel(LogLevel.DEBUG);
      }
      
      // Resolve directory path
      const resolvedDir = path.resolve(process.cwd(), directory);
      
      // Load config if specified
      let config = undefined;
      if (options.config) {
        const configPath = path.resolve(process.cwd(), options.config);
        if (fs.existsSync(configPath)) {
          try {
            // Simple JSON parsing for CLI-provided config
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configContent);
          } catch (err) {
            console.error(`Error loading config file: ${err}`);
            process.exit(1);
          }
        } else {
          console.error(`Config file not found: ${configPath}`);
          process.exit(1);
        }
      } else {
        // Try to load config automatically
        config = await loadConfig(resolvedDir);
      }
      
      // Create options for VibeCheck
      const vibeCheckOptions: VibeCheckOptions = {
        directory: resolvedDir,
        ignorePatterns: options.ignore || [],
        skipCheckers: options.skip || [],
        verbose: options.verbose || false,
        outputFile: options.output,
        showPassed: options.passed !== false,
        format: options.format as ReportFormat,
        config
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

// Init command (generate config file)
program
  .command('init')
  .description('Generate a configuration file')
  .option('-t, --type <type>', 'Config type (basic, strict, next, supabase)', 'basic')
  .option('-f, --file <file>', 'Output file name', 'vibecheck.config.json')
  .action((options) => {
    try {
      const configPath = path.resolve(process.cwd(), options.file);
      
      // Check if file already exists
      if (fs.existsSync(configPath)) {
        console.error(`Config file already exists: ${configPath}`);
        console.error('Use --file to specify a different filename');
        process.exit(1);
      }
      
      // Create config based on type
      let config = {};
      
      switch(options.type) {
        case 'basic':
          config = {
            extends: 'vibecheck:recommended',
            ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**']
          };
          break;
        case 'strict':
          config = {
            extends: 'vibecheck:strict',
            ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**']
          };
          break;
        case 'next':
          config = {
            extends: 'vibecheck:next',
            ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
          };
          break;
        case 'supabase':
          config = {
            extends: 'vibecheck:supabase',
            ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**']
          };
          break;
        default:
          console.error(`Unknown config type: ${options.type}`);
          process.exit(1);
      }
      
      // Write config file
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`Created config file: ${configPath}`);
    } catch (err) {
      console.error('Error:', err);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(); 