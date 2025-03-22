# Linting and Code Quality Standards

## Automatic Linter Issue Resolution
- Always check for and fix linter issues when making code changes
- Continue checking for linter issues until none are detected
- Do not skip or ignore warnings without explicitly providing a reason
- Fix linter issues proactively without waiting to be asked

## React Hook Rules
- Ensure all dependencies are properly listed in useEffect, useCallback, and useMemo dependency arrays
- Wrap object/function creations in useMemo/useCallback to maintain reference stability
- Properly handle cleanup functions in useEffect hooks
- Use the React DevTools to verify component rendering behavior

## ESLint Rules
- Follow the ESLint configuration for the project
- Address all ESLint warnings, not just errors
- If a rule needs to be disabled, use the appropriate ESLint comment (e.g., // eslint-disable-next-line) and explain why
- Run ESLint verification on generated code before submitting

## TypeScript Type Safety
- Avoid using `any` type unless absolutely necessary
- Use proper type annotations for all variables, parameters, and return types
- Leverage TypeScript's utility types for common patterns
- Ensure type safety across component boundaries

## Code Quality Verification
- After making changes, perform a self-review to identify potential issues
- Look for edge cases and error conditions that might not be covered by linting
- Check for performance issues, particularly in React components
- Verify that the code follows consistent styling and naming conventions

## Documentation
- Add proper JSDoc comments for functions and components
- Document complex logic or algorithms
- Include examples for complex utility functions
- Update documentation when changing existing code

## Testing
- Ensure existing tests pass after making changes
- Add new tests for new functionality when appropriate
- Test edge cases and error conditions
- Verify component behavior across different states

## Performance
- Check for unnecessary re-renders in React components
- Optimize expensive operations
- Use React.memo, useMemo, and useCallback appropriately
- Watch for memory leaks, especially in cleanup functions

## Security
- Validate all user inputs
- Sanitize data before displaying it to prevent XSS
- Avoid direct DOM manipulation
- Follow security best practices for the framework being used

## Accessibility
- Ensure proper ARIA attributes are used
- Use semantic HTML elements
- Verify keyboard navigation works correctly
- Test color contrast and screen reader compatibility

Always run a complete verification pass before considering any code change complete. 