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
  config?: ConfigFile;
}

// Configuration file structure
export interface ConfigFile {
  extends?: string; // Extend another config
  ignorePatterns?: string[];
  skipCheckers?: string[];
  severityOverrides?: SeverityOverride[];
  ignoreIssues?: string[]; // IDs of issues to ignore
  reportOptions?: ReportOptions;
  checkerOptions?: CheckerOptions;
}

// Override severity for specific checkers or issues
export interface SeverityOverride {
  id: string; // Checker ID or specific issue ID
  severity: Severity;
}

// Options specific to checkers
export interface CheckerOptions {
  apiKey?: ApiKeyCheckerOptions;
  nextJs?: NextJsCheckerOptions;
  supabase?: SupabaseCheckerOptions;
  // Add other checker-specific options as needed
}

// API Key Checker options
export interface ApiKeyCheckerOptions {
  additionalPatterns?: ApiKeyPattern[];
  ignorePatterns?: string[];
}

export interface ApiKeyPattern {
  service: string;
  pattern: string;
  recommendation: string;
}

// Next.js Checker options
export interface NextJsCheckerOptions {
  checkPublicEnv?: boolean;
  additionalEnvFiles?: string[];
}

// Supabase Checker options
export interface SupabaseCheckerOptions {
  checkRls?: boolean;
  checkStorage?: boolean;
  additionalTables?: string[];
} 