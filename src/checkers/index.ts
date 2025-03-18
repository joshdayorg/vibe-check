import { Checker } from '../types';
import { apiKeyChecker } from './api-key-checker';
import { rateLimitChecker } from './rate-limit-checker';
import { nextPublicEnvChecker } from './next/public-env-checker';
import { supabaseRlsChecker } from './supabase/rls-checker';

// Add all checkers to this array
export const checkers: Checker[] = [
  nextPublicEnvChecker,
  supabaseRlsChecker,
  apiKeyChecker,
  rateLimitChecker
];

// Export individual checkers for direct import
export { nextPublicEnvChecker } from './next/public-env-checker';
export { supabaseRlsChecker } from './supabase/rls-checker';
export { apiKeyChecker } from './api-key-checker';
export { rateLimitChecker } from './rate-limit-checker'; 