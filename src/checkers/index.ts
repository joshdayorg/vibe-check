import { Checker, CheckOptions } from '../types';
import { nextPublicEnvChecker } from './next/public-env-checker';
import { rlsChecker } from './supabase/rls-checker';
import { apiKeyChecker } from './api-key-checker';
import { rateLimitChecker } from './rate-limit-checker';
import { jwtStorageChecker } from './jwt-storage-checker';
import { corsChecker } from './cors-checker';
import { aiCostControlsChecker } from './ai-cost-controls-checker';
import { insecureCookiesChecker } from './insecure-cookies-checker';
import { check as xssCheck } from './xss-checker';
import { check as authCheck } from './auth-checker';
import { check as configCheck } from './config-checker';
import { check as validationCheck } from './input-validation-checker';
import { check as disclosureCheck } from './info-disclosure-checker';

export const checkers: Checker[] = [
  nextPublicEnvChecker,
  rlsChecker,
  apiKeyChecker,
  rateLimitChecker,
  jwtStorageChecker,
  corsChecker,
  aiCostControlsChecker,
  insecureCookiesChecker,
  {
    id: 'xss',
    name: 'Cross-Site Scripting (XSS)',
    description: 'Check for potential XSS vulnerabilities',
    check: async (options: CheckOptions) => xssCheck(options.directory)
  },
  {
    id: 'auth',
    name: 'Authentication Security',
    description: 'Check for authentication security issues',
    check: async (options: CheckOptions) => authCheck(options.directory)
  },
  {
    id: 'config',
    name: 'Configuration Security',
    description: 'Check for security issues in configuration files',
    check: async (options: CheckOptions) => configCheck(options.directory)
  },
  {
    id: 'validation',
    name: 'Input Validation',
    description: 'Check for missing or insufficient input validation',
    check: async (options: CheckOptions) => validationCheck(options.directory)
  },
  {
    id: 'disclosure',
    name: 'Information Disclosure',
    description: 'Check for potential information disclosure vulnerabilities',
    check: async (options: CheckOptions) => disclosureCheck(options.directory)
  }
];