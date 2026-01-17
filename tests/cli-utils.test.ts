/**
 * yamllint-ts - TypeScript YAML Linter
 * CLI Utilities Unit Tests
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  PROBLEM_LEVELS,
  walkDirectory,
  findFilesRecursively,
  supportsColor,
  Format,
  getEffectiveFormat,
  formatProblem,
  findProjectConfigFilepath,
  getUserGlobalConfigPath,
} from '../src/cli-utils.js';
import { YamlLintConfig } from '../src/config.js';
import type { LintProblem } from '../src/linter.js';
import '../src/rules/index.js';

let tempDir: string;

describe('CLI Utilities', () => {
  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yamllint-ts-cli-utils-test-'));
  });

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('constants', () => {
    it('should export APP_NAME', () => {
      expect(APP_NAME).toBe('yamllint-ts');
    });

    it('should export APP_VERSION', () => {
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should export APP_DESCRIPTION', () => {
      expect(APP_DESCRIPTION).toContain('YAML linter');
    });

    it('should export PROBLEM_LEVELS', () => {
      expect(PROBLEM_LEVELS.error).toBe(2);
      expect(PROBLEM_LEVELS.warning).toBe(1);
    });
  });

  describe('walkDirectory', () => {
    it('should walk a directory recursively', () => {
      const testDir = path.join(tempDir, 'walk-test');
      fs.mkdirSync(testDir, { recursive: true });
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content');
      fs.writeFileSync(path.join(testDir, 'subdir', 'file2.txt'), 'content');

      const files = [...walkDirectory(testDir)];
      expect(files).toHaveLength(2);
      expect(files.some((f) => f.endsWith('file1.txt'))).toBe(true);
      expect(files.some((f) => f.endsWith('file2.txt'))).toBe(true);
    });

    it('should return empty for empty directory', () => {
      const emptyDir = path.join(tempDir, 'empty-dir');
      fs.mkdirSync(emptyDir, { recursive: true });

      const files = [...walkDirectory(emptyDir)];
      expect(files).toHaveLength(0);
    });
  });

  describe('findFilesRecursively', () => {
    it('should find YAML files in directory', () => {
      const testDir = path.join(tempDir, 'find-test');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'file.yaml'), '---\nkey: value\n');
      fs.writeFileSync(path.join(testDir, 'file.yml'), '---\nkey: value\n');
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'not yaml');

      const conf = new YamlLintConfig('extends: default');
      const files = [...findFilesRecursively([testDir], conf)];

      expect(files.some((f) => f.endsWith('.yaml'))).toBe(true);
      expect(files.some((f) => f.endsWith('.yml'))).toBe(true);
      expect(files.some((f) => f.endsWith('.txt'))).toBe(false);
    });

    it('should return single file if passed directly', () => {
      const testFile = path.join(tempDir, 'single.yaml');
      fs.writeFileSync(testFile, '---\nkey: value\n');

      const conf = new YamlLintConfig('extends: default');
      const files = [...findFilesRecursively([testFile], conf)];

      expect(files).toHaveLength(1);
      expect(files[0]).toBe(testFile);
    });

    it('should skip non-existent paths', () => {
      const conf = new YamlLintConfig('extends: default');
      const files = [...findFilesRecursively(['/nonexistent/path'], conf)];
      expect(files).toHaveLength(0);
    });
  });

  describe('supportsColor', () => {
    it('should return a boolean', () => {
      expect(typeof supportsColor()).toBe('boolean');
    });
  });

  describe('Format', () => {
    const mockProblem: LintProblem = {
      line: 5,
      column: 10,
      level: 'error',
      rule: 'test-rule',
      desc: 'Test description',
      message: 'Test description (test-rule)',
    };

    const mockWarning: LintProblem = {
      line: 3,
      column: 1,
      level: 'warning',
      rule: 'another-rule',
      desc: 'Warning description',
      message: 'Warning description (another-rule)',
    };

    describe('parsable', () => {
      it('should format problem in parsable format', () => {
        const result = Format.parsable(mockProblem, 'test.yaml');
        expect(result).toBe('test.yaml:5:10: [error] Test description (test-rule)');
      });
    });

    describe('standard', () => {
      it('should format problem in standard format', () => {
        const result = Format.standard(mockProblem, 'test.yaml');
        expect(result).toContain('5:10');
        expect(result).toContain('error');
        expect(result).toContain('Test description');
        expect(result).toContain('(test-rule)');
      });
    });

    describe('standardColor', () => {
      it('should format error with color codes', () => {
        const result = Format.standardColor(mockProblem, 'test.yaml');
        expect(result).toContain('5:10');
        expect(result).toContain('Test description');
      });

      it('should format warning with color codes', () => {
        const result = Format.standardColor(mockWarning, 'test.yaml');
        expect(result).toContain('3:1');
        expect(result).toContain('Warning description');
      });
    });

    describe('github', () => {
      it('should format problem in GitHub Actions format', () => {
        const result = Format.github(mockProblem, 'test.yaml');
        expect(result).toContain('::error');
        expect(result).toContain('file=test.yaml');
        expect(result).toContain('line=5');
        expect(result).toContain('col=10');
        expect(result).toContain('[test-rule]');
        expect(result).toContain('Test description');
      });
    });
  });

  describe('getEffectiveFormat', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should return format as-is if not auto', () => {
      expect(getEffectiveFormat('parsable')).toBe('parsable');
      expect(getEffectiveFormat('standard')).toBe('standard');
      expect(getEffectiveFormat('github')).toBe('github');
    });

    it('should detect GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';
      process.env.GITHUB_WORKFLOW = 'test';
      expect(getEffectiveFormat('auto')).toBe('github');
    });

    it('should return standard when not in GitHub and no TTY', () => {
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITHUB_WORKFLOW;
      // In test environment, likely no TTY
      const result = getEffectiveFormat('auto');
      expect(['standard', 'colored']).toContain(result);
    });
  });

  describe('formatProblem', () => {
    const mockProblem: LintProblem = {
      line: 1,
      column: 1,
      level: 'error',
      rule: 'test',
      desc: 'Test',
      message: 'Test (test)',
    };

    it('should format using parsable format', () => {
      const result = formatProblem(mockProblem, 'test.yaml', 'parsable');
      expect(result).toContain('[error]');
    });

    it('should format using standard format', () => {
      const result = formatProblem(mockProblem, 'test.yaml', 'standard');
      expect(result).toContain('error');
      expect(result).toContain('(test)');
    });

    it('should format using github format', () => {
      const result = formatProblem(mockProblem, 'test.yaml', 'github');
      expect(result).toContain('::error');
    });
  });

  describe('findProjectConfigFilepath', () => {
    it('should find .yamllint file', () => {
      const testDir = path.join(tempDir, 'config-test');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint'), 'extends: default\n');

      const result = findProjectConfigFilepath(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint'));
    });

    it('should find .yamllint.yaml file', () => {
      const testDir = path.join(tempDir, 'config-test-yaml');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint.yaml'), 'extends: default\n');

      const result = findProjectConfigFilepath(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint.yaml'));
    });

    it('should find .yamllint.yml file', () => {
      const testDir = path.join(tempDir, 'config-test-yml');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint.yml'), 'extends: default\n');

      const result = findProjectConfigFilepath(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint.yml'));
    });

    it('should return null if no config found', () => {
      const testDir = path.join(tempDir, 'no-config');
      fs.mkdirSync(testDir, { recursive: true });

      const result = findProjectConfigFilepath(testDir);
      expect(result).toBeNull();
    });
  });

  describe('getUserGlobalConfigPath', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should use YAMLLINT_CONFIG_FILE if set', () => {
      process.env.YAMLLINT_CONFIG_FILE = '/custom/config';
      expect(getUserGlobalConfigPath()).toBe('/custom/config');
    });

    it('should use XDG_CONFIG_HOME if set', () => {
      delete process.env.YAMLLINT_CONFIG_FILE;
      process.env.XDG_CONFIG_HOME = '/xdg/config';
      expect(getUserGlobalConfigPath()).toBe('/xdg/config/yamllint/config');
    });

    it('should use ~/.config/yamllint/config by default', () => {
      delete process.env.YAMLLINT_CONFIG_FILE;
      delete process.env.XDG_CONFIG_HOME;
      const result = getUserGlobalConfigPath();
      expect(result).toContain('.config');
      expect(result).toContain('yamllint');
      expect(result).toContain('config');
    });
  });
});
