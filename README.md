# VibeCheck

A security scanner for modern web applications that helps developers identify common security issues, especially in Next.js, Supabase, and AI-integrated applications.

## Features

VibeCheck currently checks for:

- **Next.js Environment Variables**: Detects sensitive data exposed in `NEXT_PUBLIC_` environment variables
- **API Key Exposure**: Finds hardcoded API keys from various services (OpenAI, Supabase, AWS, etc.)
- **Supabase Row Level Security**: Identifies tables missing RLS or with insecure public policies
- **API Rate Limiting**: Detects API routes without proper rate limiting
- **JWT Insecure Storage**: Finds JWT tokens stored insecurely in localStorage or sessionStorage
- **CORS Misconfigurations**: Identifies insecure CORS settings that could lead to cross-origin attacks
- **AI Cost Controls**: Detects missing controls for AI APIs that could lead to unexpected costs

## Installation

```bash
# Install globally
npm install -g @sparky123/vibecheck

# Or run with npx
npx @sparky123/vibecheck
```

## Quick Start

```bash
# Go to your project directory
cd your-project

# Run the security scan
vibecheck scan .
```

## Usage

```bash
# Scan the current directory
vibecheck

# Scan a specific directory
vibecheck scan /path/to/your/project

# Skip specific checkers
vibecheck scan --skip api-key-checker rate-limit-checker

# Generate a detailed report
vibecheck scan --output vibecheck-report.md
```

### Options

- `--verbose`: Show detailed output
- `--output <file>`: Save the report to a file
- `--format <format>`: Report format (markdown, json, text)
- `--ignore <patterns...>`: Glob patterns to ignore
- `--skip <checkers...>`: Checkers to skip
- `--no-passed`: Hide passed checks in the report

## Security Checkers

### Next.js Public Environment Variable Checker

The `next-public-env-checker` scans for sensitive data in environment variables with the `NEXT_PUBLIC_` prefix. These variables are included in the client-side bundle and are visible to anyone who views your website.

#### Issues Detected:

- API keys exposed in public environment variables
- Authentication secrets visible in the client-side code
- Sensitive configuration accessible in frontend code

#### Recommendation:

Move sensitive data to server-side environment variables (without the `NEXT_PUBLIC_` prefix) and access them via API routes or server components.

### API Key Checker

The `api-key-checker` looks for hardcoded API keys and secrets in your codebase that could be committed to version control.

#### Issues Detected:

- OpenAI, Anthropic, and other AI service keys
- Supabase, Firebase, and other database service keys
- AWS, Google Cloud, and other infrastructure credentials

#### Recommendation:

Store API keys in environment variables and use proper secret management.

### Supabase RLS Checker

The `supabase-rls-checker` analyzes your SQL files to ensure Row Level Security is properly configured.

#### Issues Detected:

- Tables without RLS enabled
- Public policies that grant unrestricted access
- Missing access controls for sensitive data

#### Recommendation:

Enable RLS for all tables and create proper access policies.

### API Rate Limiting Checker

The `rate-limit-checker` identifies API routes missing rate limiting protection.

#### Issues Detected:

- Endpoints vulnerable to abuse and DoS attacks
- No protection against brute force attacks
- Missing throttling for expensive operations

#### Recommendation:

Implement rate limiting with libraries like rate-limiter-flexible or @upstash/ratelimit.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
