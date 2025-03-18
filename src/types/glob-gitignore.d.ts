declare module 'glob-gitignore' {
  export function createGitignoreFilter(gitignoreContent: string): (path: string) => boolean;
} 