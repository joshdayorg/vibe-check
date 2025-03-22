# VibeCheck

VibeCheck is a security scanner that helps identify potential security issues in your web applications **and** makes it easy to fix them with AI-powered coding tools.

## Quick Start for Beginners

VibeCheck offers a complete security workflow in just a few steps:

1. **Run the scan** (no installation needed):
   ```bash
   npx @sparky123/vibecheck
   ```

2. **Open the HTML report** that was generated (the file path will be shown in the console output)

3. **Click "Copy" on any issue** you want to fix - this formats all the relevant details for AI-powered coding tools

4. **Paste the issue into Cursor, Windsurf, or your preferred AI code editor** and ask for a fix

That's it! This "scan → copy → paste → fix" workflow bridges the gap between security scanning and actual remediation, making security accessible to developers of all skill levels.

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

You can install VibeCheck globally:

```bash
npm install -g @sparky123/vibecheck
```

Or run it directly with npx:

```bash
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

## Configuration

VibeCheck can be configured using a configuration file. The following file formats are supported:

- `vibecheck.config.js` (JavaScript)
- `vibecheck.config.json` (JSON)
- `.vibecheckrc` (JSON)
- `.vibecheckrc.json` (JSON)
- `.vibecheckrc.js` (JavaScript)

You can generate a basic configuration file using:

```bash
npx vibecheck init
```

Or with specific configurations:

```bash
npx vibecheck init --type next
```

Available config types:
- `basic` - Basic recommended settings
- `strict` - More strict security settings
- `next` - Settings optimized for Next.js projects
- `supabase` - Settings optimized for Supabase projects

### Configuration Options

```json
{
  "extends": "vibecheck:recommended", // Extend a built-in config
  "ignorePatterns": [ // Glob patterns to ignore
    "**/node_modules/**", 
    "**/dist/**", 
    "**/build/**"
  ],
  "skipCheckers": [ // Checkers to skip
    "api-key-checker"
  ],
  "severityOverrides": [ // Override severity for specific issues
    { 
      "id": "jwt-storage-checker", 
      "severity": "critical" 
    }
  ],
  "ignoreIssues": [ // IDs of specific issues to ignore
    "specific-issue-id"
  ],
  "reportOptions": { // Options for reports
    "format": "html",
    "showPassed": false
  },
  "checkerOptions": { // Options for specific checkers
    "nextJs": {
      "checkPublicEnv": true
    },
    "supabase": {
      "checkRls": true
    },
    "apiKey": {
      "additionalPatterns": [
        {
          "service": "Custom API",
          "pattern": "custom-[a-z0-9]{32}",
          "recommendation": "Store custom API keys in environment variables"
        }
      ]
    }
  }
}
```

### Built-in Configurations

VibeCheck comes with several built-in configurations:

- `vibecheck:recommended` - Default recommended settings
- `vibecheck:strict` - More strict security settings
- `vibecheck:next` - Settings optimized for Next.js projects
- `vibecheck:supabase` - Settings optimized for Supabase projects

You can extend these in your configuration:

```json
{
  "extends": "vibecheck:recommended",
  "ignorePatterns": ["**/my-specific-pattern/**"]
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
