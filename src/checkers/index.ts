import { Checker } from '../types';
import { apiKeyChecker } from './api-key-checker';
import { rateLimitChecker } from './rate-limit-checker';

// Add all checkers to this array
export const checkers: Checker[] = [
  apiKeyChecker,
  rateLimitChecker,
  // Add more checkers here
];

// Export individual checkers for direct import
export { apiKeyChecker } from './api-key-checker';
export { rateLimitChecker } from './rate-limit-checker'; 