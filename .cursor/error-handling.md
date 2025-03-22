# Error Handling Rule

Use consistent error handling patterns throughout the codebase to ensure reliability and better debugging.

## Best Practices

1. **Use typed errors:** Create custom error classes that extend `Error` to provide more context.
2. **Provide meaningful error messages:** Include details about what went wrong and potential solutions.
3. **Use try/catch blocks:** Properly catch and handle errors at appropriate levels.
4. **Log errors appropriately:** Ensure errors are logged with sufficient context.
5. **Return error states:** Use return types that include error information (Result types, Either, etc.).

## Implementation

### Custom Error Classes

```typescript
// errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

### Using Result Types

```typescript
// types.ts
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E> {
  success: false;
  error: E;
}

// utility functions
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

export function failure<E>(error: E): Failure<E> {
  return { success: false, error };
}
```

### Usage Examples

```typescript
// fetch user data with proper error handling
async function fetchUserData(userId: string): Promise<Result<User, APIError>> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    
    if (!response.ok) {
      return failure(new APIError(
        `Failed to fetch user: ${response.statusText}`,
        response.status,
        { userId }
      ));
    }
    
    const data = await response.json();
    return success(data);
  } catch (err) {
    // Handle unexpected errors
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Unexpected error fetching user data', { 
      userId, 
      error: error.message
    });
    return failure(new APIError(
      'An unexpected error occurred while fetching user data',
      500,
      { userId }
    ));
  }
}

// Using the result
const userResult = await fetchUserData('123');

if (userResult.success) {
  // Handle success case with userResult.data
  const user = userResult.data;
  renderUserProfile(user);
} else {
  // Handle error case with userResult.error
  handleError(userResult.error);
}
```

## Testing Error Scenarios

Always include tests for error scenarios:

```typescript
test('fetchUserData handles API errors correctly', async () => {
  // Mock a failed API response
  fetchMock.mockRejectOnce(new Error('Network error'));
  
  const result = await fetchUserData('123');
  
  expect(result.success).toBe(false);
  expect(result.error).toBeInstanceOf(APIError);
  expect(result.error.statusCode).toBe(500);
});
``` 