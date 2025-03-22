# Security Standards Rule

Follow these security standards to prevent common vulnerabilities and ensure a secure codebase.

## Input Validation

Always validate and sanitize all user inputs:

```typescript
// Bad: Direct use of user input
app.get('/users/:id', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  // SQL injection risk!
});

// Good: Parameterized query
app.get('/users/:id', (req, res) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [req.params.id], (err, results) => {
    // Safe from SQL injection
  });
});
```

## Authentication & Authorization

1. **Use secure authentication libraries** instead of rolling your own.
2. **Implement proper authorization checks** for all protected resources.
3. **Use HTTPS everywhere** for production environments.
4. **Implement CSRF protection** on all state-changing operations.

```typescript
// Example: Authorization middleware
function requireAuth(role: string = 'user') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (role !== 'user' && req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Applying the middleware
app.get('/admin/users', requireAuth('admin'), (req, res) => {
  // Only admins can access this endpoint
});
```

## Sensitive Data Handling

1. **Never hardcode secrets** - use environment variables.
2. **Hash passwords** with strong algorithms like bcrypt or Argon2.
3. **Encrypt sensitive data** in transit and at rest.
4. **Apply the principle of least privilege** for all data access.

```typescript
// Bad: Hardcoded secrets
const apiKey = 'abc123secret';

// Good: Environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}

// Password hashing
import * as bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

## Security Headers

Implement proper security headers for all responses:

```typescript
// Using helmet middleware in Express
import helmet from 'helmet';
app.use(helmet());

// Or manual implementation
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## Dependency Management

1. **Regularly update dependencies** to fix security vulnerabilities.
2. **Use dependency scanning tools** in your CI/CD pipeline.
3. **Limit the use of third-party packages** to reduce your attack surface.

```bash
# Check for vulnerable dependencies
npm audit

# Update packages safely
npm update

# Fix vulnerabilities
npm audit fix
```

## Error Handling

Never expose sensitive information in error messages:

```typescript
// Bad: Leaking internal details
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack });
});

// Good: Safe error handling
app.use((err, req, res, next) => {
  // Log the detailed error for debugging
  console.error(err);
  
  // Return a safe message to the client
  res.status(500).json({ 
    error: 'An unexpected error occurred',
    id: req.id // Reference ID for support
  });
});
```

## Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

// Basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Apply to all API endpoints
app.use('/api/', apiLimiter);
``` 