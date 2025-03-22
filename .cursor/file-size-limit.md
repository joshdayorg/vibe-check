# File Size Limit Rule

Ensure no file exceeds 200 lines of code (LOC). If a file exceeds this limit, split it into smaller, logical files and place them in the appropriate subdirectory.

## Why?

- Files over 200 lines become difficult to understand and maintain
- Smaller files promote better organization and modular code
- Separating concerns improves testability and reusability

## How to Apply

1. Identify logical groupings of functionality
2. Extract related functions/components into their own files
3. Use meaningful directory structures and file names
4. Ensure proper imports and exports

## Examples

Instead of:
```typescript
// auth.ts with 300+ lines
export function login() { ... }
export function register() { ... }
export function resetPassword() { ... }
export function validateToken() { ... }
// ...many more auth functions
```

Split into:
```typescript
// auth/login.ts
export function login() { ... }

// auth/register.ts
export function register() { ... }

// auth/password.ts
export function resetPassword() { ... }

// auth/token.ts
export function validateToken() { ... }

// auth/index.ts (barrel file for easier imports)
export * from './login';
export * from './register';
export * from './password';
export * from './token';
``` 