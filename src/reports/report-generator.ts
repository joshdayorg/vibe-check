import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { CheckResult, ReportOptions } from '../types';
import * as logger from '../utils/logger';

export class ReportGenerator {
  private results: CheckResult[];
  
  constructor(results: CheckResult[]) {
    this.results = results;
  }
  
  /**
   * Print report to console
   */
  printConsoleReport(showPassed = true): void {
    const failedResults = this.results.filter(result => !result.passed);
    const passedResults = this.results.filter(result => result.passed);
    
    logger.header('🔍 VibeCheck Scan Results');
    logger.separator();
    
    // Print summary
    if (failedResults.length === 0) {
      logger.success(`All checks passed! ${passedResults.length} checks performed.`);
    } else {
      logger.warn(`Found ${failedResults.length} potential issues.`);
    }
    
    logger.separator();
    
    // Group by severity
    const criticalIssues = failedResults.filter(r => r.severity === 'critical');
    const highIssues = failedResults.filter(r => r.severity === 'high');
    const mediumIssues = failedResults.filter(r => r.severity === 'medium');
    const lowIssues = failedResults.filter(r => r.severity === 'low');
    
    // Print failed checks by severity
    if (criticalIssues.length > 0) {
      logger.header(`Critical Issues (${criticalIssues.length})`);
      this.printIssueGroup(criticalIssues);
    }
    
    if (highIssues.length > 0) {
      logger.header(`High Severity Issues (${highIssues.length})`);
      this.printIssueGroup(highIssues);
    }
    
    if (mediumIssues.length > 0) {
      logger.header(`Medium Severity Issues (${mediumIssues.length})`);
      this.printIssueGroup(mediumIssues);
    }
    
    if (lowIssues.length > 0) {
      logger.header(`Low Severity Issues (${lowIssues.length})`);
      this.printIssueGroup(lowIssues);
    }
    
    // Print passed checks if requested
    if (showPassed && passedResults.length > 0) {
      logger.header(`Passed Checks (${passedResults.length})`);
      for (const result of passedResults) {
        logger.success(`✓ ${result.name}`);
        if (result.details) {
          console.log(`  ${result.details}`);
        }
        console.log('');
      }
    }
    
    logger.separator();
    console.log(`Run ${chalk.cyan('vibecheck report')} to generate a detailed report file.\n`);
  }
  
  /**
   * Print a group of issues
   */
  private printIssueGroup(issues: CheckResult[]): void {
    for (const issue of issues) {
      const fileDetail = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : '';
      console.log(chalk.red(`✗ ${issue.name}${fileDetail}`));
      
      if (issue.details) {
        console.log(`  ${issue.details}`);
      }
      
      if (issue.code) {
        console.log(chalk.gray('  Code:'));
        console.log(chalk.gray(`  ${issue.code}`));
      }
      
      if (issue.recommendation) {
        console.log(chalk.green(`  Recommendation: ${issue.recommendation}`));
      }
      
      console.log('');
    }
  }
  
  /**
   * Generate a report file in the specified format
   */
  async generateReportFile(options: ReportOptions): Promise<string> {
    const { format = 'markdown', outputFile, showPassed = true } = options;
    
    // Generate report content based on format
    let content = '';
    
    switch (format) {
      case 'json':
        content = this.generateJsonReport();
        break;
      case 'text':
        content = this.generateTextReport(showPassed);
        break;
      case 'markdown':
      default:
        content = this.generateMarkdownReport(showPassed);
        break;
    }
    
    // Determine output filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `vibecheck-report-${timestamp}.${format === 'json' ? 'json' : format === 'text' ? 'txt' : 'md'}`;
    const reportFile = outputFile || defaultFilename;
    
    // Write to file
    await fs.writeFile(reportFile, content);
    
    return reportFile;
  }
  
  /**
   * Generate a JSON format report
   */
  private generateJsonReport(): string {
    return JSON.stringify({
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
        timestamp: new Date().toISOString()
      },
      results: this.results
    }, null, 2);
  }
  
  /**
   * Generate a text format report
   */
  private generateTextReport(showPassed = true): string {
    const lines: string[] = [];
    const failedResults = this.results.filter(result => !result.passed);
    const passedResults = this.results.filter(result => result.passed);
    
    lines.push('VIBECHECK SCAN RESULTS');
    lines.push('======================');
    lines.push('');
    
    // Add summary
    lines.push(`Scan completed on ${new Date().toLocaleString()}`);
    lines.push(`Total checks: ${this.results.length}`);
    lines.push(`Passed: ${passedResults.length}`);
    lines.push(`Failed: ${failedResults.length}`);
    lines.push('');
    
    // Group by severity
    const criticalIssues = failedResults.filter(r => r.severity === 'critical');
    const highIssues = failedResults.filter(r => r.severity === 'high');
    const mediumIssues = failedResults.filter(r => r.severity === 'medium');
    const lowIssues = failedResults.filter(r => r.severity === 'low');
    
    // Add failed checks by severity
    if (criticalIssues.length > 0) {
      lines.push(`CRITICAL ISSUES (${criticalIssues.length})`);
      lines.push('-----------------');
      this.addIssueGroupToTextReport(criticalIssues, lines);
    }
    
    if (highIssues.length > 0) {
      lines.push(`HIGH SEVERITY ISSUES (${highIssues.length})`);
      lines.push('--------------------');
      this.addIssueGroupToTextReport(highIssues, lines);
    }
    
    if (mediumIssues.length > 0) {
      lines.push(`MEDIUM SEVERITY ISSUES (${mediumIssues.length})`);
      lines.push('----------------------');
      this.addIssueGroupToTextReport(mediumIssues, lines);
    }
    
    if (lowIssues.length > 0) {
      lines.push(`LOW SEVERITY ISSUES (${lowIssues.length})`);
      lines.push('-------------------');
      this.addIssueGroupToTextReport(lowIssues, lines);
    }
    
    // Add passed checks if requested
    if (showPassed && passedResults.length > 0) {
      lines.push(`PASSED CHECKS (${passedResults.length})`);
      lines.push('--------------');
      
      for (const result of passedResults) {
        lines.push(`✓ ${result.name}`);
        if (result.details) {
          lines.push(`  ${result.details}`);
        }
        lines.push('');
      }
    }
    
    lines.push('');
    lines.push('Generated by VibeCheck - https://github.com/yourusername/vibecheck');
    
    return lines.join('\n');
  }
  
  /**
   * Add a group of issues to a text report
   */
  private addIssueGroupToTextReport(issues: CheckResult[], lines: string[]): void {
    for (const issue of issues) {
      const fileDetail = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : '';
      lines.push(`✗ ${issue.name}${fileDetail}`);
      
      if (issue.details) {
        lines.push(`  ${issue.details}`);
      }
      
      if (issue.code) {
        lines.push('  Code:');
        lines.push(`  ${issue.code}`);
      }
      
      if (issue.recommendation) {
        lines.push(`  Recommendation: ${issue.recommendation}`);
      }
      
      lines.push('');
    }
  }
  
  /**
   * Generate a markdown format report
   */
  private generateMarkdownReport(showPassed = true): string {
    const lines: string[] = [];
    const failedResults = this.results.filter(result => !result.passed);
    const passedResults = this.results.filter(result => result.passed);
    
    lines.push('# VibeCheck Scan Results');
    lines.push('');
    
    // Add summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Scan completed on:** ${new Date().toLocaleString()}`);
    lines.push(`- **Total checks:** ${this.results.length}`);
    lines.push(`- **Passed:** ${passedResults.length}`);
    lines.push(`- **Failed:** ${failedResults.length}`);
    lines.push('');
    
    // Group by severity
    const criticalIssues = failedResults.filter(r => r.severity === 'critical');
    const highIssues = failedResults.filter(r => r.severity === 'high');
    const mediumIssues = failedResults.filter(r => r.severity === 'medium');
    const lowIssues = failedResults.filter(r => r.severity === 'low');
    
    // Add failed checks by severity
    if (criticalIssues.length > 0) {
      lines.push(`## Critical Issues (${criticalIssues.length})`);
      lines.push('');
      this.addIssueGroupToMarkdownReport(criticalIssues, lines);
    }
    
    if (highIssues.length > 0) {
      lines.push(`## High Severity Issues (${highIssues.length})`);
      lines.push('');
      this.addIssueGroupToMarkdownReport(highIssues, lines);
    }
    
    if (mediumIssues.length > 0) {
      lines.push(`## Medium Severity Issues (${mediumIssues.length})`);
      lines.push('');
      this.addIssueGroupToMarkdownReport(mediumIssues, lines);
    }
    
    if (lowIssues.length > 0) {
      lines.push(`## Low Severity Issues (${lowIssues.length})`);
      lines.push('');
      this.addIssueGroupToMarkdownReport(lowIssues, lines);
    }
    
    // Add passed checks if requested
    if (showPassed && passedResults.length > 0) {
      lines.push(`## Passed Checks (${passedResults.length})`);
      lines.push('');
      
      for (const result of passedResults) {
        lines.push(`### ✅ ${result.name}`);
        lines.push('');
        
        if (result.details) {
          lines.push(result.details);
          lines.push('');
        }
      }
    }
    
    lines.push('---');
    lines.push('*Generated by [VibeCheck](https://github.com/yourusername/vibecheck)*');
    
    return lines.join('\n');
  }
  
  /**
   * Add a group of issues to a markdown report
   */
  private addIssueGroupToMarkdownReport(issues: CheckResult[], lines: string[]): void {
    for (const issue of issues) {
      const fileDetail = issue.file ? ` (${issue.file}${issue.line ? `:${issue.line}` : ''})` : '';
      lines.push(`### ❌ ${issue.name}${fileDetail}`);
      lines.push('');
      
      if (issue.details) {
        lines.push(issue.details);
        lines.push('');
      }
      
      if (issue.code) {
        lines.push('```');
        lines.push(issue.code);
        lines.push('```');
        lines.push('');
      }
      
      if (issue.recommendation) {
        lines.push('**Recommendation:**');
        lines.push(issue.recommendation);
        lines.push('');
      }
    }
  }
} 