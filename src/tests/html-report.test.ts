import * as fs from 'fs-extra';
import { HtmlReportGenerator } from '../reports/html-report-generator';
import { CheckResult, Severity } from '../types';

describe('HtmlReportGenerator', () => {
  const mockResults: CheckResult[] = [
    {
      id: 'test-critical',
      name: 'Critical Test',
      description: 'A critical test issue',
      severity: Severity.Critical,
      passed: false,
      details: 'Critical issue details',
      file: 'test.ts',
      location: {
        file: 'test.ts',
        line: 42,
        code: 'const secret = "hardcoded-secret";'
      },
      recommendation: 'Use environment variables for secrets'
    },
    {
      id: 'test-passed',
      name: 'Passed Test',
      description: 'A passing test',
      severity: Severity.Low,
      passed: true,
      details: 'Everything looks good'
    }
  ];

  let generator: HtmlReportGenerator;
  const testOutputFile = 'test-report.html';

  beforeEach(() => {
    generator = new HtmlReportGenerator(mockResults);
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.remove(testOutputFile);
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should generate an HTML report', async () => {
    const reportFile = await generator.generateReport(testOutputFile);
    
    // Verify file exists
    const exists = await fs.pathExists(reportFile);
    expect(exists).toBe(true);
    
    // Read file contents
    const content = await fs.readFile(reportFile, 'utf8');
    
    // Check for key elements
    expect(content).toContain('VibeCheck Security Report');
    expect(content).toContain('Critical Test');
    expect(content).toContain('test.ts:42');
    expect(content).toContain('const secret = &quot;hardcoded-secret&quot;');
    expect(content).toContain('Use environment variables for secrets');
    expect(content).toContain('Passed Test');
    expect(content).toContain('Everything looks good');
    
    // Check for structural elements
    expect(content).toContain('severity-badge severity-critical');
    expect(content).toContain('class="code-block"');
    expect(content).toContain('class="recommendation"');
    expect(content).toContain('💡 Recommendation');
  });
}); 