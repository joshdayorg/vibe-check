export enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export type ReportFormat = 'text' | 'json' | 'markdown' | 'html';

export interface CheckResult {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  passed: boolean;
  details: string;
  location?: {
    file: string;
    line: number;
    code: string;
  };
  file?: string;
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

export interface NextJsCheckOptions extends CheckOptions {
  checkPublicEnv?: boolean;
  checkApiRoutes?: boolean;
}

export interface SupabaseCheckOptions extends CheckOptions {
  checkRls?: boolean;
  checkStorage?: boolean;
  checkAuth?: boolean;
}

export interface ReportOptions {
  format?: ReportFormat;
  outputFile?: string;
  showPassed?: boolean;
}

export interface VibeCheckOptions extends CheckOptions, ReportOptions {
  fix?: boolean;
} 