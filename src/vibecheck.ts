import * as path from 'path';
import * as fs from 'fs-extra';
import { CheckResult, VibeCheckOptions, Checker, ReportOptions, CheckOptions, Severity, ConfigFile } from './types';
import { checkers } from './checkers';
import { generateReport } from './reports';
import * as logger from './utils/logger';
import { loadConfig, getSeverityOverride, isIssueIgnored } from './utils/config-loader';

export class VibeCheck {
  private options: VibeCheckOptions;
  private availableCheckers: Checker[];
  private config?: ConfigFile;
  
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
    
    // Store config
    this.config = options.config;
    
    // Combine CLI ignore patterns with config ignore patterns
    if (this.config?.ignorePatterns) {
      this.options.ignorePatterns = [
        ...(this.options.ignorePatterns || []),
        ...this.config.ignorePatterns
      ];
    }
    
    // Combine CLI skip checkers with config skip checkers
    if (this.config?.skipCheckers) {
      this.options.skipCheckers = [
        ...(this.options.skipCheckers || []),
        ...this.config.skipCheckers
      ];
    }
    
    // Apply report options from config if present
    if (this.config?.reportOptions) {
      this.options = {
        ...this.options,
        ...this.config.reportOptions
      };
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
    
    try {
      // Load config if not already loaded
      if (!this.config) {
        this.config = await loadConfig(this.options.directory);
        
        // Update options with config values
        if (this.config) {
          logger.debug('Loaded configuration file');
          
          // Update ignore patterns and skip checkers
          if (this.config.ignorePatterns) {
            this.options.ignorePatterns = [
              ...(this.options.ignorePatterns || []),
              ...this.config.ignorePatterns
            ];
          }
          
          if (this.config.skipCheckers) {
            this.options.skipCheckers = [
              ...(this.options.skipCheckers || []),
              ...this.config.skipCheckers
            ];
            
            // Update available checkers
            this.availableCheckers = checkers.filter(
              (checker: Checker) => !this.options.skipCheckers?.includes(checker.id)
            );
          }
          
          // Apply report options from config
          if (this.config.reportOptions) {
            this.options = {
              ...this.options,
              ...this.config.reportOptions
            };
          }
        }
      }
      
      if (this.options.verbose) {
        logger.debug(`Using options: ${JSON.stringify(this.options, null, 2)}`);
        logger.debug(`Running ${this.availableCheckers.length} checkers`);
      }
      
      // Verify directory exists
      const directoryExists = await fs.pathExists(this.options.directory);
      if (!directoryExists) {
        throw new Error(`Directory ${this.options.directory} does not exist`);
      }
      
      // Run all checkers
      const results = await this.runCheckers();
      
      // Apply severity overrides and filter ignored issues
      const processedResults = this.processResults(results);
      
      // Generate report
      const reportFile = await generateReport(
        processedResults,
        this.options.format,
        this.options.outputFile
      );
      
      // Print console report
      const failedResults = processedResults.filter(result => !result.passed);
      if (failedResults.length > 0) {
        logger.warn(`Found ${failedResults.length} potential issues. See report for details: ${reportFile}`);
      } else {
        logger.success(`All checks passed! See report for details: ${reportFile}`);
      }
      
      return processedResults;
    } catch (err) {
      return this.handleError(err as Error);
    }
  }

  private async handleError(err: Error): Promise<CheckResult[]> {
    logger.error(
      `Error during scan: ${err}`, 
      logger.ErrorCategory.UNKNOWN, 
      err
    );
    
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
    
    // Run each checker
    for (const checker of this.availableCheckers) {
      try {
        // Create checker-specific options by merging config
        const checkerOptions: CheckOptions = {
          ...this.options,
          // Add checker-specific options if available
          ...(this.config?.checkerOptions?.[checker.id as keyof typeof this.config.checkerOptions])
        };
        
        logger.debug(`Running checker: ${checker.id}`);
        const checkerResults = await checker.check(checkerOptions);
        results.push(...checkerResults);
      } catch (err) {
        logger.error(
          `Error in checker ${checker.id}: ${err}`, 
          logger.ErrorCategory.CHECKER, 
          err as Error
        );
        
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
  
  /**
   * Process results to apply severity overrides and filter ignored issues
   */
  private processResults(results: CheckResult[]): CheckResult[] {
    if (!this.config) {
      return results;
    }
    
    return results
      // Filter out ignored issues
      .filter(result => !isIssueIgnored(result.id, this.config))
      // Apply severity overrides
      .map(result => {
        const severityOverride = getSeverityOverride(result.id, this.config);
        if (severityOverride && !result.passed) {
          return {
            ...result,
            severity: severityOverride,
            details: result.details + 
              (severityOverride !== result.severity 
                ? ` (Severity overridden from ${result.severity} to ${severityOverride})`
                : '')
          };
        }
        return result;
      });
  }
} 