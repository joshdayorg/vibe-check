import { Checker } from '../types';

// Import existing checkers
import { apiKeyChecker } from './api-key-checker';
import { rateLimitChecker } from './rate-limit-checker';
import { nextPublicEnvChecker } from './next/public-env-checker';
import { supabaseRlsChecker } from './supabase/rls-checker';

// Import new checkers
import { jwtStorageChecker } from './jwt-storage-checker';
import { corsChecker } from './cors-checker';
import { aiCostControlsChecker } from './ai-cost-controls-checker';
import { insecureCookiesChecker } from './insecure-cookies-checker';

// Original checkers array
export const checkers: Checker[] = [
  nextPublicEnvChecker,
  supabaseRlsChecker,
  apiKeyChecker,
  rateLimitChecker
];

// Comprehensive checkers array with all security checks
export const allCheckers: Checker[] = [
  ...checkers,
  jwtStorageChecker,
  corsChecker,
  aiCostControlsChecker,
  insecureCookiesChecker
];

// Export individual checkers for direct import
export { nextPublicEnvChecker } from './next/public-env-checker';
export { supabaseRlsChecker } from './supabase/rls-checker';
export { apiKeyChecker } from './api-key-checker';
export { rateLimitChecker } from './rate-limit-checker';

// Export new checkers
export { jwtStorageChecker } from './jwt-storage-checker';
export { corsChecker } from './cors-checker';
export { aiCostControlsChecker } from './ai-cost-controls-checker';
export { insecureCookiesChecker } from './insecure-cookies-checker'; 