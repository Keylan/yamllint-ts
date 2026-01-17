/**
 * yamllint-ts - TypeScript YAML Linter
 * CLI Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CLI_PATH = path.resolve('dist/cli.js');
let tempDir: string;

/**
 * Run the CLI with given arguments
 */
function runCli(
  args: string[],
  options: { stdin?: string; env?: Record<string, string> } = {}
): { stdout: string; stderr: string; exitCode: number } {
  try {
    // Quote args that contain special characters
    const quotedArgs = args.map((arg) => {
      if (arg.includes(' ') || arg.includes('{') || arg.includes('}')) {
        return `'${arg}'`;
      }
      return arg;
    });
    const result = execSync(`node ${CLI_PATH} ${quotedArgs.join(' ')}`, {
      encoding: 'utf-8',
      input: options.stdin,
      env: { ...process.env, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: result, stderr: '', exitCode: 0 };
  } catch (e) {
    const error = e as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.status ?? 1,
    };
  }
}

/**
 * Create a temporary file with given content
 */
function createTempFile(name: string, content: string): string {
  const filePath = path.join(tempDir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

/**
 * Create a temporary directory
 */
function createTempDir(name: string): string {
  const dirPath = path.join(tempDir, name);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

describe('CLI', () => {
  beforeAll(() => {
    // Create temp directory for test files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yamllint-ts-test-'));

    // Ensure CLI is built
    try {
      fs.accessSync(CLI_PATH);
    } catch {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });

  afterAll(() => {
    // Cleanup temp directory
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('basic invocation', () => {
    it('should show help with --help', () => {
      const result = runCli(['--help']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('yamllint-ts');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('--config-file');
      expect(result.stdout).toContain('--format');
    });

    it('should show version with --version', () => {
      const result = runCli(['--version']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should show version with -v', () => {
      const result = runCli(['-v']);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should error when no files specified', () => {
      const result = runCli([]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No files specified');
    });
  });

  describe('file linting', () => {
    it('should lint a valid YAML file with no errors', () => {
      const file = createTempFile('valid.yaml', '---\nkey: value\n');
      const result = runCli([file]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('');
    });

    it('should detect errors in invalid YAML', () => {
      const file = createTempFile('invalid.yaml', '---\nkey: value\nkey: duplicate\n');
      const result = runCli([file]);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('key-duplicates');
    });

    it('should detect warnings', () => {
      const file = createTempFile('warning.yaml', '---\nyes: value\n');
      const result = runCli([file]);
      // truthy is a warning by default
      expect(result.stdout).toContain('truthy');
    });

    it('should return exit code 0 for warnings without --strict', () => {
      const file = createTempFile('warning2.yaml', '---\ntrue: value\n');
      const result = runCli([file]);
      expect(result.exitCode).toBe(0);
    });

    it('should return exit code 2 for warnings with --strict', () => {
      const file = createTempFile('warning3.yaml', '---\nyes: value\n');
      const result = runCli(['--strict', file]);
      expect(result.exitCode).toBe(2);
    });

    it('should lint multiple files', () => {
      const file1 = createTempFile('multi1.yaml', '---\nkey: value\n');
      const file2 = createTempFile('multi2.yaml', '---\nother: value\n');
      const result = runCli([file1, file2]);
      expect(result.exitCode).toBe(0);
    });

    it('should handle non-existent file', () => {
      const result = runCli(['/nonexistent/file.yaml']);
      // Non-existent files are silently skipped (no matching files found)
      expect(result.exitCode).toBe(0);
    });
  });

  describe('directory linting', () => {
    it('should recursively lint YAML files in directory', () => {
      const dir = createTempDir('subdir');
      fs.writeFileSync(path.join(dir, 'file1.yaml'), '---\nkey: value\n');
      fs.writeFileSync(path.join(dir, 'file2.yml'), '---\nother: value\n');
      const result = runCli([dir]);
      expect(result.exitCode).toBe(0);
    });

    it('should only lint yaml/yml files by default', () => {
      const dir = createTempDir('mixed');
      fs.writeFileSync(path.join(dir, 'file.yaml'), '---\nkey: value\n');
      fs.writeFileSync(path.join(dir, 'file.txt'), 'not yaml');
      const result = runCli(['--list-files', dir]);
      expect(result.stdout).toContain('file.yaml');
      expect(result.stdout).not.toContain('file.txt');
    });
  });

  describe('--list-files', () => {
    it('should list files without linting', () => {
      const dir = createTempDir('listdir');
      fs.writeFileSync(path.join(dir, 'a.yaml'), '---\nkey: value\n');
      fs.writeFileSync(path.join(dir, 'b.yml'), '---\nother: value\n');
      const result = runCli(['--list-files', dir]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('a.yaml');
      expect(result.stdout).toContain('b.yml');
    });
  });

  describe('--config-data / -d', () => {
    it('should accept inline config with -d', () => {
      const file = createTempFile('config-d.yaml', '---\nkey: value\n');
      const result = runCli(['-d', 'extends: relaxed', file]);
      expect(result.exitCode).toBe(0);
    });

    it('should accept shorthand config name', () => {
      const file = createTempFile('config-short.yaml', '---\nkey: value\n');
      const result = runCli(['-d', 'relaxed', file]);
      expect(result.exitCode).toBe(0);
    });

    it('should accept inline rule config', () => {
      const file = createTempFile('config-rule.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli([
        '-d',
        '{extends: default, rules: {key-duplicates: disable, empty-lines: disable}}',
        file,
      ]);
      expect(result.exitCode).toBe(0);
    });

    it('should error on invalid config', () => {
      const file = createTempFile('config-invalid.yaml', '---\nkey: value\n');
      const result = runCli(['-d', '{rules: {nonexistent-rule: enable}}', file]);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Configuration error');
    });
  });

  describe('--config-file / -c', () => {
    it('should accept config file with -c', () => {
      const configFile = createTempFile('.yamllint-custom', 'extends: relaxed\n');
      const file = createTempFile('config-c.yaml', '---\nkey: value\n');
      const result = runCli(['-c', configFile, file]);
      expect(result.exitCode).toBe(0);
    });

    it('should error on missing config file', () => {
      const file = createTempFile('config-missing.yaml', '---\nkey: value\n');
      const result = runCli(['-c', '/nonexistent/config.yaml', file]);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('--format / -f', () => {
    it('should output parsable format', () => {
      const file = createTempFile('format-parsable.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['-f', 'parsable', file]);
      expect(result.stdout).toMatch(/.*:\d+:\d+: \[error\]/);
    });

    it('should output standard format', () => {
      const file = createTempFile('format-standard.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['-f', 'standard', file]);
      expect(result.stdout).toContain(file);
      expect(result.stdout).toContain('error');
      expect(result.stdout).toContain('key-duplicates');
    });

    it('should output github format', () => {
      const file = createTempFile('format-github.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['-f', 'github', file]);
      expect(result.stdout).toContain('::error');
      expect(result.stdout).toContain('::group::');
      expect(result.stdout).toContain('::endgroup::');
    });

    it('should auto-detect github format in CI', () => {
      const file = createTempFile('format-auto-gh.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['-f', 'auto', file], {
        env: { GITHUB_ACTIONS: 'true', GITHUB_WORKFLOW: 'test' },
      });
      expect(result.stdout).toContain('::error');
    });
  });

  describe('--no-warnings', () => {
    it('should hide warnings with --no-warnings', () => {
      const file = createTempFile('no-warn.yaml', '---\nyes: value\n');
      const result = runCli(['--no-warnings', file]);
      // Should not contain truthy warning
      expect(result.stdout).not.toContain('truthy');
    });

    it('should still show errors with --no-warnings', () => {
      const file = createTempFile('no-warn-err.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['--no-warnings', file]);
      expect(result.stdout).toContain('key-duplicates');
    });
  });

  describe('--stdin', () => {
    it('should read from stdin', () => {
      const result = runCli(['--stdin'], { stdin: '---\nkey: value\n' });
      expect(result.exitCode).toBe(0);
    });

    it('should detect errors from stdin', () => {
      const result = runCli(['--stdin'], { stdin: '---\nkey: value\nkey: dup\n' });
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('key-duplicates');
    });

    it('should label stdin output as stdin', () => {
      const result = runCli(['--stdin', '-f', 'parsable'], {
        stdin: '---\nkey: value\nkey: dup\n',
      });
      expect(result.stdout).toContain('stdin:');
    });
  });

  describe('syntax errors', () => {
    it('should report YAML syntax errors', () => {
      const file = createTempFile('syntax.yaml', '---\nkey: [\n');
      const result = runCli([file]);
      expect(result.exitCode).toBe(1);
    });

    it('should report syntax errors in parsable format', () => {
      const file = createTempFile('syntax-parsable.yaml', '---\nkey: [\n');
      const result = runCli(['-f', 'parsable', file]);
      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain('[error]');
    });
  });

  describe('colored output', () => {
    it('should output colored format when requested', () => {
      const file = createTempFile('colored.yaml', '---\nkey: value\nkey: dup\n');
      const result = runCli(['-f', 'colored', file]);
      expect(result.exitCode).toBe(1);
      // Just verify it runs - actual colors depend on terminal
      expect(result.stdout).toContain('key-duplicates');
    });
  });
});
