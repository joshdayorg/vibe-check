import * as fs from 'fs-extra';
import { CheckResult, Severity } from '../types';

export class HtmlReportGenerator {
  private results: CheckResult[];
  
  constructor(results: CheckResult[]) {
    this.results = results;
  }

  async generateReport(outputFile?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `vibecheck-report-${timestamp}.html`;
    const reportFile = outputFile || defaultFilename;

    const html = this.generateHtml();
    await fs.writeFile(reportFile, html);
    
    return reportFile;
  }

  private generateHtml(): string {
    const failedResults = this.results.filter(result => !result.passed);
    const passedResults = this.results.filter(result => result.passed);
    
    const criticalIssues = failedResults.filter(r => r.severity === Severity.Critical);
    const highIssues = failedResults.filter(r => r.severity === Severity.High);
    const mediumIssues = failedResults.filter(r => r.severity === Severity.Medium);
    const lowIssues = failedResults.filter(r => r.severity === Severity.Low);

    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VibeCheck Security Report</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            :root {
                --critical: #dc3545;
                --high: #fd7e14;
                --medium: #ffc107;
                --low: #0dcaf0;
                --success: #198754;
            }
            .severity-badge {
                display: inline-block;
                padding: 0.25em 0.6em;
                font-size: 0.75em;
                font-weight: 700;
                border-radius: 0.375rem;
                text-transform: uppercase;
            }
            .severity-critical { background-color: var(--critical); color: white; }
            .severity-high { background-color: var(--high); color: white; }
            .severity-medium { background-color: var(--medium); color: black; }
            .severity-low { background-color: var(--low); color: black; }
            .severity-success { background-color: var(--success); color: white; }
            
            .issue-card {
                margin-bottom: 1rem;
                border-left: 4px solid transparent;
            }
            .issue-card.critical { border-left-color: var(--critical); }
            .issue-card.high { border-left-color: var(--high); }
            .issue-card.medium { border-left-color: var(--medium); }
            .issue-card.low { border-left-color: var(--low); }
            
            .copy-button {
                position: absolute;
                top: 1rem;
                right: 1rem;
                padding: 0.25rem 0.5rem;
                font-size: 0.875rem;
                color: #6c757d;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 0.375rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .copy-button:hover {
                background: #e9ecef;
                color: #495057;
            }
            .copy-button.copied {
                background: var(--success);
                color: white;
                border-color: var(--success);
            }
            
            .code-block {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 0.375rem;
                font-family: monospace;
                white-space: pre-wrap;
                margin: 0.5rem 0;
            }
            
            .recommendation {
                background: #e9ecef;
                padding: 1rem;
                border-radius: 0.375rem;
                margin: 0.5rem 0;
            }
            
            #search {
                max-width: 300px;
            }
            
            .stats-card {
                transition: transform 0.2s;
            }
            .stats-card:hover {
                transform: translateY(-2px);
            }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-dark bg-dark">
            <div class="container-fluid">
                <span class="navbar-brand mb-0 h1">⚡ VibeCheck Security Report</span>
                <input type="text" id="search" class="form-control form-control-sm" placeholder="Search issues...">
            </div>
        </nav>

        <div class="container mt-4">
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card bg-danger text-white">
                        <div class="card-body">
                            <h6 class="card-title">Critical Issues</h6>
                            <h2 class="card-text">${criticalIssues.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card bg-warning">
                        <div class="card-body">
                            <h6 class="card-title">High Severity</h6>
                            <h2 class="card-text">${highIssues.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Medium/Low</h6>
                            <h2 class="card-text">${mediumIssues.length + lowIssues.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Passed Checks</h6>
                            <h2 class="card-text">${passedResults.length}</h2>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Issues List -->
            <div class="accordion" id="issuesAccordion">
                ${this.generateSeveritySection('Critical Issues', criticalIssues, 'critical')}
                ${this.generateSeveritySection('High Severity Issues', highIssues, 'high')}
                ${this.generateSeveritySection('Medium Severity Issues', mediumIssues, 'medium')}
                ${this.generateSeveritySection('Low Severity Issues', lowIssues, 'low')}
                ${this.generatePassedSection(passedResults)}
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            document.getElementById('search').addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.issue-card').forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
            });

            document.querySelectorAll('.copy-button').forEach(button => {
                button.addEventListener('click', async function() {
                    const card = this.closest('.issue-card');
                    const issueData = card.getAttribute('data-issue');
                    
                    try {
                        await navigator.clipboard.writeText(issueData);
                        this.textContent = '✓ Copied!';
                        this.classList.add('copied');
                        setTimeout(() => {
                            this.textContent = 'Copy';
                            this.classList.remove('copied');
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy:', err);
                        this.textContent = '❌ Error';
                        setTimeout(() => {
                            this.textContent = 'Copy';
                        }, 2000);
                    }
                });
            });
        </script>
    </body>
    </html>`;
  }

  private generateSeveritySection(title: string, issues: CheckResult[], severityClass: string): string {
    if (issues.length === 0) return '';

    return `
    <div class="card mb-3">
        <div class="card-header bg-light">
            <h5 class="mb-0">
                <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#${severityClass}Section">
                    ${title} (${issues.length})
                </button>
            </h5>
        </div>
        <div id="${severityClass}Section" class="collapse">
            <div class="card-body">
                ${issues.map(issue => this.generateIssueCard(issue, severityClass)).join('')}
            </div>
        </div>
    </div>`;
  }

  private generatePassedSection(passedResults: CheckResult[]): string {
    if (passedResults.length === 0) return '';

    return `
    <div class="card mb-3">
        <div class="card-header bg-light">
            <h5 class="mb-0">
                <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#passedSection">
                    Passed Checks (${passedResults.length})
                </button>
            </h5>
        </div>
        <div id="passedSection" class="collapse show">
            <div class="card-body">
                ${passedResults.map(result => `
                    <div class="alert alert-success">
                        <strong>✓ ${result.name}</strong>
                        ${result.details ? `<p class="mb-0 mt-2">${result.details}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
  }

  private generateIssueCard(issue: CheckResult, severityClass: string): string {
    const fileDetail = issue.file ? 
        `<small class="text-muted">${issue.file}${issue.location?.line ? `:${issue.location.line}` : ''}</small>` : '';

    // Create a formatted version of the issue for copying
    const issueText = `Issue: ${issue.name}
Severity: ${issue.severity}
${issue.file ? `File: ${issue.file}${issue.location?.line ? `:${issue.location.line}` : ''}\n` : ''}${issue.details ? `Details: ${issue.details}\n` : ''}${issue.recommendation ? `Recommendation: ${issue.recommendation}\n` : ''}${issue.location?.code ? `Code:\n${issue.location.code}` : ''}`;

    return `
    <div class="card issue-card ${severityClass}" data-issue="${this.escapeHtml(issueText)}">
        <div class="card-body position-relative">
            <button class="copy-button">Copy</button>
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h5 class="card-title mb-0">${issue.name}</h5>
                <span class="severity-badge severity-${severityClass}">${issue.severity}</span>
            </div>
            ${fileDetail}
            <p class="card-text mt-2">${issue.details || ''}</p>
            ${issue.location?.code ? `
                <div class="code-block">${this.escapeHtml(issue.location.code)}</div>
            ` : ''}
            ${issue.recommendation ? `
                <div class="recommendation">
                    <strong>💡 Recommendation:</strong><br>
                    ${issue.recommendation}
                </div>
            ` : ''}
        </div>
    </div>`;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
} 