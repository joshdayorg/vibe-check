# VibeCheck

A TypeScript CLI scanner for developers to quickly check their codebase for security issues and best practice violations.

## 🔍 Features

- **API Key Detection**: Find exposed API keys and secrets in your code
- **Rate Limiting Checks**: Ensure your APIs have rate limiting protection
- **Detailed Reports**: Generate reports in Markdown, JSON, or plain text
- **AI-Ready Output**: Use the generated reports with AI tools like Cursor to fix issues

## 📦 Installation

### From GitHub

```bash
npm install -g git+https://github.com/yourusername/vibecheck.git
```

### Local Development

```bash
git clone https://github.com/yourusername/vibecheck.git
cd vibecheck
npm install
npm run build
npm link
```

## 🚀 Usage

Run VibeCheck in your project directory:

```bash
vibecheck
```

### Options

```
Usage: vibecheck [options] [command]

A security scanner for checking basic security practices in your codebase

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  scan [options] [directory]    Scan the codebase for security issues (default)
  report [options]              Generate a report file from the last scan
  list                          List all available checkers
  help [command]                display help for command
```

### Scan Command Options

```
Usage: vibecheck scan [options] [directory]

Scan the codebase for security issues

Arguments:
  directory                    Directory to scan (default: ".")

Options:
  -i, --ignore <patterns...>   Glob patterns to ignore
  -s, --skip <checkers...>     Checkers to skip
  -v, --verbose                Enable verbose output
  -f, --format <format>        Output format (markdown, json, text) (default: "markdown")
  -o, --output <file>          Output file for the report
  --no-passed                  Do not show passed checks in the report
  -h, --help                   display help for command
```

## 🧩 Checkers

The following security checkers are included:

- **API Key Checker**: Detects exposed API keys and secrets in your code
- **Rate Limit Checker**: Checks if your API endpoints have rate limiting implemented

## 🛠 Examples

### Basic Scan

```bash
vibecheck
```

### Scan a Specific Directory with Verbose Output

```bash
vibecheck scan ./my-project -v
```

### Generate a Report File

```bash
vibecheck -o report.md
```

### Skip Certain Checkers

```bash
vibecheck -s api-key-checker
```

## 📝 Working with AI

After generating a report, you can:

1. Copy the report content
2. Paste it into Cursor, GitHub Copilot, or other AI code assistant
3. Ask for help fixing the identified issues

Example prompt:

```
I ran VibeCheck on my project and it found these issues. Can you help me fix them?

[PASTE REPORT HERE]
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new checkers
- Improve existing checkers
- Enhance reporting capabilities
- Fix bugs

## 📄 License

MIT 