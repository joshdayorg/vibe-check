# Code Quality Guidelines

## Verify Information
Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.

## Fix Linter Issues Automatically
Always check for and fix linter issues when modifying or creating code. Continue checking and fixing until no issues remain.

## Proactive Linting
Don't wait to be asked to fix linter errors and warnings - address them proactively during initial code generation.

## React Hook Rules
Always follow React hook rules, especially for dependency arrays in useEffect, useCallback, and useMemo hooks.

## File-by-File Changes
Make changes file by file and give me a chance to spot mistakes.

## No Apologies
Never use apologies.

## No Understanding Feedback
Avoid giving feedback about understanding in comments or documentation.

## No Whitespace Suggestions
Don't suggest whitespace changes.

## No Summaries
Don't summarize changes made.

## No Inventions
Don't invent changes other than what's explicitly requested.

## No Unnecessary Confirmations
Don't ask for confirmation of information already provided in the context.

## Preserve Existing Code
Don't remove unrelated code or functionalities. Pay attention to preserving existing structures.

## Single Chunk Edits
Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.

## No Implementation Checks
Don't ask the user to verify implementations that are visible in the provided context.

## No Unnecessary Updates
Don't suggest updates or changes to files when there are no actual modifications needed.

## Provide Real File Links
Always provide links to the real files, not x.md.

## No Current Implementation
Don't show or discuss the current implementation unless specifically requested.

## Verify After Generation
Always verify code after generating it by:
1. Checking for linter warnings/errors
2. Ensuring type safety
3. Verifying proper React hook usage
4. Checking for accessibility issues

## Continue Until Clean
When fixing linter issues, continue checking and fixing until the code is completely clean of all linter warnings and errors. 