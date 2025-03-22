# TypeScript Best Practices Rule

Use TypeScript effectively to maximize type safety and code clarity.

## Type Definitions

### Define Return Types Explicitly

Always define function return types explicitly unless they are obvious:

```typescript
// Bad
function getUser(id: string) {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// Good
function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```

### Use Strict Type-Checking

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

### Use Interfaces for Objects

Prefer interfaces for object definitions unless you need specific features of types:

```typescript
// Preferred
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Use type for unions, intersections, or other complex types
type UserOrAdmin = User | Admin;
type ID = string | number;
```

### Use Const Assertions for Literal Values

```typescript
// Without assertion - type is string[]
const roles = ['admin', 'user', 'guest'];

// With assertion - type is readonly ['admin', 'user', 'guest']
const roles = ['admin', 'user', 'guest'] as const;

// Now you can use it for types
type Role = typeof roles[number]; // 'admin' | 'user' | 'guest'
```

## Null Handling

### Use Optional Chaining and Nullish Coalescing

```typescript
// Optional chaining
const userName = user?.profile?.name;

// Nullish coalescing
const displayName = userName ?? 'Anonymous';
```

### Don't Use `any`

Avoid using `any` as it defeats the purpose of TypeScript. Use `unknown` instead when the type is truly not known:

```typescript
// Bad
function processData(data: any): any {
  return data.map(item => item.value);
}

// Good
function processData<T extends { value: U }, U>(data: T[]): U[] {
  return data.map(item => item.value);
}

// When truly unknown
function parseInput(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof Error) {
    return input.message;
  }
  return String(input);
}
```

## Functional Patterns

### Use Readonly Types for Immutability

```typescript
// Define readonly interface
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

// Or use ReadonlyArray
function sortItems(items: ReadonlyArray<Item>): Item[] {
  // Cannot modify the original array
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}
```

### Use Mapped Types for Transformations

```typescript
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Read-only version of a type
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Example usage
interface User {
  id: string;
  name: string;
  email?: string;
}

// For creating a new user (id might be generated)
type NewUser = Omit<User, 'id'>;

// For updating a user (all fields optional)
type UserUpdate = Partial<User>;
```

## Project Organization

### Use Barrel Files for Clean Imports

```typescript
// components/index.ts
export * from './Button';
export * from './Input';
export * from './Card';

// Usage in other files
import { Button, Input, Card } from './components';
```

### Separate Types into Dedicated Files

Keep your types organized in dedicated files:

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
}

export interface UserProfile {
  avatar: string;
  bio: string;
}

// Usage
import { User, UserProfile } from './types/user';
```

## Error Handling

### Use Discriminated Unions for Results

```typescript
type Result<T> = 
  | { success: true; data: T } 
  | { success: false; error: Error };

function fetchData(): Promise<Result<User[]>> {
  try {
    // ...fetch implementation
    return { success: true, data: users };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}

// Usage
const result = await fetchData();
if (result.success) {
  // TypeScript knows result.data is User[]
  renderUsers(result.data);
} else {
  // TypeScript knows result.error is Error
  handleError(result.error);
}
``` 