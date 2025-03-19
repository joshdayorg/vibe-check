import * as path from 'path';
import * as fs from 'fs-extra';
import { CheckResult, VibeCheckOptions, Checker, ReportOptions, CheckOptions, Severity } from './types';
import { checkers } from './checkers';
import { generateReport } from './reports';
import * as logger from './utils/logger';

export class VibeCheck {
  private options: VibeCheckOptions;
  private availableCheckers: Checker[];
  
  constructor(options: VibeCheckOptions) {
    // Set default options
    this.options = {
      // Remove the directory default since it will be overwritten by options
      ignorePatterns: [],
      skipCheckers: [],
      verbose: false,
      showPassed: true,
      format: 'markdown',
      ...options
    };
    
    // If directory is not provided, use current working directory
    if (!this.options.directory) {
      this.options.directory = process.cwd();
    }
    
    // Filter out skipped checkers
    this.availableCheckers = checkers.filter(
      (checker: Checker) => !this.options.skipCheckers?.includes(checker.id)
    );
  }
  
  /**
   * Run all checks and generate a report
   */
  async run(): Promise<CheckResult[]> {
    logger.info(`Starting VibeCheck on ${this.options.directory}`);
    
    if (this.options.verbose) {
      logger.debug(`Using options: ${JSON.stringify(this.options, null, 2)}`);
      logger.debug(`Running ${this.availableCheckers.length} checkers`);
    }
    
    try {
      // Verify directory exists
      const directoryExists = await fs.pathExists(this.options.directory);
      if (!directoryExists) {
        throw new Error(`Directory ${this.options.directory} does not exist`);
      }
      
      // Run all checkers
      const results = await this.runCheckers();
      
      // Generate report
      const reportFile = await generateReport(
        results,
        this.options.format,
        this.options.outputFile
      );
      
      // Print console report
      const failedResults = results.filter(result => !result.passed);
      if (failedResults.length > 0) {
        logger.warn(`Found ${failedResults.length} potential issues. See report for details: ${reportFile}`);
      } else {
        logger.success(`All checks passed! See report for details: ${reportFile}`);
      }
      
      return results;
    } catch (err) {
      return this.handleError(err as Error);
    }
  }

  private async handleError(err: Error): Promise<CheckResult[]> {
    logger.error(`Error during scan: ${err}`);
    
    return [{
      id: 'scan-error',
      name: 'Scan Error',
      description: 'An error occurred during the security scan',
      severity: Severity.Medium,
      passed: false,
      details: `Error: ${err.message}`
    }];
  }

  private async runCheckers(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    // Filter out skipped checkers
    const enabledCheckers = checkers.filter(
      (checker: Checker) => !this.options.skipCheckers?.includes(checker.id)
    );
    
    // Run each checker
    for (const checker of enabledCheckers) {
      try {
        const checkerResults = await checker.check(this.options);
        results.push(...checkerResults);
      } catch (err) {
        logger.error(`Error in checker ${checker.id}: ${err}`);
        results.push({
          id: `${checker.id}-error`,
          name: `${checker.name} Error`,
          description: `An error occurred during the ${checker.name} check`,
          severity: Severity.Medium,
          passed: false,
          details: `Error: ${err}`
        });
      }
    }
    
    return results;
  }
} 