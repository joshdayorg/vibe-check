import * as path from 'path';
import * as fs from 'fs-extra';
import { CheckResult, VibeCheckOptions, Checker } from './types';
import { checkers } from './checkers';
import { ReportGenerator } from './reports';
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
      checker => !this.options.skipCheckers?.includes(checker.id)
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
      const allResults: CheckResult[] = [];
      
      for (const checker of this.availableCheckers) {
        logger.info(`Running checker: ${checker.name}`);
        
        try {
          const results = await checker.check({
            directory: this.options.directory,
            ignorePatterns: this.options.ignorePatterns,
            verbose: this.options.verbose
          });
          
          allResults.push(...results);
          
          if (this.options.verbose) {
            logger.debug(`Checker ${checker.name} found ${results.length} results`);
          }
        } catch (err) {
          logger.error(`Error running checker ${checker.name}: ${err}`);
          
          allResults.push({
            id: `${checker.id}-error`,
            name: `${checker.name} Error`,
            description: `An error occurred during the ${checker.name}`,
            severity: 'medium',
            passed: false,
            details: `Error: ${err}`
          });
        }
      }
      
      // Generate report
      const reportGenerator = new ReportGenerator(allResults);
      
      // Print report to console
      reportGenerator.printConsoleReport(this.options.showPassed);
      
      // Generate file report if outputFile is specified
      if (this.options.outputFile) {
        const reportFile = await reportGenerator.generateReportFile({
          outputFile: this.options.outputFile,
          format: this.options.format,
          showPassed: this.options.showPassed
        });
        
        logger.success(`Report saved to ${reportFile}`);
      }
      
      return allResults;
    } catch (err) {
      logger.error(`Error running VibeCheck: ${err}`);
      throw err;
    }
  }
} 