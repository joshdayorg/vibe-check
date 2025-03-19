import { CheckResult, ReportOptions } from '../types';
import { ReportGenerator } from './report-generator';
import { HtmlReportGenerator } from './html-report-generator';

export type ReportFormat = 'text' | 'json' | 'markdown' | 'html';

export async function generateReport(results: CheckResult[], format: ReportFormat = 'text', outputFile?: string): Promise<string> {
  if (format === 'html') {
    const htmlGenerator = new HtmlReportGenerator(results);
    return htmlGenerator.generateReport(outputFile);
  }

  const generator = new ReportGenerator(results);
  return generator.generateReportFile({ format, outputFile });
}

export { ReportGenerator, HtmlReportGenerator };
