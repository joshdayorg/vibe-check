# VibeCheck

VibeCheck is a security scanner that helps identify potential security issues in your web applications **and** makes it easy to fix them with AI-powered coding tools.

## Quick Start with Cursor

VibeCheck works seamlessly within Cursor for the fastest security scanning and fixing experience:

1. **Type in Cursor chat:**
   ```
   npx @sparky123/vibecheck
   ```

2. **Let Cursor help you fix the issues**
   - Cursor will automatically read the generated markdown report
   - The AI will offer solutions for each security issue
   - Accept the fixes and continue through each issue

That's it! With Cursor, the entire security workflow happens within your editor - from scanning to fixing, with AI assistance every step of the way.

## Features

- **Comprehensive security scanning**
  - Identifies common security vulnerabilities
  - Checks for application-specific issues
  - Finds issues across frontend and backend code

- **Detailed reports with recommendations**
  - Security issues ranked by severity
  - Clear explanations of each vulnerability
  - Specific recommendations for fixing issues

- **Framework-specific checks**
  - Next.js
  - Supabase
  - General web security best practices

- **Multiple report formats**
  - Markdown (default in Cursor)
  - HTML (with copy-to-clipboard functionality)
  - JSON (for programmatic usage)
  - Text (for terminal output)

## Installation

You can run VibeCheck directly from your Cursor chat without installation:

```bash
npx @sparky123/vibecheck
```

For global installation (not usually necessary):

```bash
npm install -g @sparky123/vibecheck
```

## Usage

### In Cursor (Recommended)

Simply type the command in your Cursor chat:

```
npx @sparky123/vibecheck
```

Cursor will automatically read the generated report and offer to help you fix each issue.

### Configuration

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

See the [Configuration](#configuration) section for more details.

## Alternative Approaches

While using VibeCheck directly in Cursor is recommended, you can also use it in other environments:

### Command Line Usage

Run from the command line and open the report file manually:

```bash
npx @sparky123/vibecheck
```

This will generate a report file that you can open and review.

### With Other AI Tools

If you're not using Cursor, you can:

1. Run VibeCheck with HTML output format:
   ```bash
   npx @sparky123/vibecheck -f html
   ```

2. Open the HTML report and use the "Copy" buttons
   
3. Paste the issues into your preferred AI tool and ask for fixes

## Advanced Options

```
Usage: vibecheck [options] [directory]

Options:
  -f, --format <format>  Report format (text, json, markdown, html) (default: "markdown")
  -o, --output <file>    Output file for the report
  -i, --ignore <patterns...>  Glob patterns to ignore
  -s, --skip <checkers...>  Checkers to skip
  -v, --verbose          Enable verbose output
  --no-passed            Do not show passed checks in the report
  -h, --help             Display help information
```

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
