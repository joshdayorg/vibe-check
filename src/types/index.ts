export interface CheckResult {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  passed: boolean;
  details?: string;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  recommendation?: string;
}

export interface Checker {
  id: string;
  name: string;
  description: string;
  check: (options: CheckOptions) => Promise<CheckResult[]>;
}

export interface CheckOptions {
  directory: string;
  ignorePatterns?: string[];
  skipCheckers?: string[];
  verbose?: boolean;
}

export interface ReportOptions {
  outputFile?: string;
  format?: 'text' | 'json' | 'markdown';
  showPassed?: boolean;
}

export interface VibeCheckOptions extends CheckOptions, ReportOptions {
  fix?: boolean;
} 