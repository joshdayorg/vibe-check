# Component Structure Rule

Group related functions, classes, or components into separate files with a consistent structure. Use meaningful directory organization and relative imports to maintain a clean architecture.

## Structure for Components

For UI components:

```typescript
// imports section
import React from 'react';
import { SomeType } from '../types';
import { useHook } from '../hooks';

// types section
interface Props {
  // component props
}

// helper functions (if needed)
function formatData(data: SomeType): string {
  // implementation
}

// component
export function ComponentName(props: Props): JSX.Element {
  // implementation
}

// optional: named exports of related utilities
export const utilities = { formatData };
```

## Directory Organization

```
src/
├── components/           # UI components
│   ├── common/           # Shared components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── hooks/                # Custom React hooks
├── utils/                # Utility functions
├── types/                # TypeScript types and interfaces
├── api/                  # API-related code
└── pages/                # Page components (Next.js)
```

## Best Practices

1. One main export per file (component, hook, utility)
2. Group related files in descriptive directories
3. Use barrel files (index.ts) for cleaner imports
4. Follow consistent naming conventions:
   - PascalCase for components and classes
   - camelCase for functions and variables
   - kebab-case for file names
5. Keep imports organized by type:
   - External libraries first
   - Internal modules next
   - Relative imports last

## Examples

**Bad:**
```typescript
// mixed concerns, no clear structure
import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { fetchData } from './api';

export function UserData() {
  // ... 150 lines of mixed concerns
}

export function formatUserData() { /* ... */ }
export function validateUserInput() { /* ... */ }
```

**Good:**
```typescript
// user/UserData.tsx
import React from 'react';
import { useUserData } from '../hooks/useUserData';
import { formatUserData } from '../utils/userUtils';
import { UserDataProps } from '../types';

export function UserData(props: UserDataProps): JSX.Element {
  // Clean, focused component
}

// hooks/useUserData.ts
export function useUserData() {
  // Hook implementation
}

// utils/userUtils.ts
export function formatUserData() { /* ... */ }
export function validateUserInput() { /* ... */ }
``` 