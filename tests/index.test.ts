/**
 * yamllint-ts - TypeScript YAML Linter
 * Main index exports tests
 */

import { describe, it, expect } from 'vitest';

import {
  VERSION,
  APP_NAME,
  APP_DESCRIPTION,
  LintProblem,
  YamlLintConfig,
  YamlLintConfigError,
  run,
  runAll,
  rules,
  ExitCode,
} from '../src/index.js';

describe('main index exports', () => {
  it('should export version info', () => {
    expect(VERSION).toBe('0.1.0');
    expect(APP_NAME).toBe('yamllint-ts');
    expect(APP_DESCRIPTION).toBe('A TypeScript YAML linter');
  });

  it('should export LintProblem class', () => {
    const problem = new LintProblem(1, 1, 'test');
    expect(problem.line).toBe(1);
    expect(problem.column).toBe(1);
  });

  it('should export YamlLintConfig class', () => {
    const config = new YamlLintConfig({ content: 'extends: default' });
    expect(config.rules.size).toBeGreaterThan(0);
  });

  it('should export YamlLintConfigError', () => {
    expect(YamlLintConfigError).toBeDefined();
  });

  it('should export linter functions', () => {
    expect(typeof run).toBe('function');
    expect(typeof runAll).toBe('function');
  });

  it('should export rules module', () => {
    expect(rules.get).toBeDefined();
    expect(rules.getAllIds).toBeDefined();
    expect(rules.exists('indentation')).toBe(true);
  });

  it('should export ExitCode constants', () => {
    expect(ExitCode.OK).toBe(0);
    expect(ExitCode.ERROR).toBe(1);
    expect(ExitCode.WARNING).toBe(2);
  });
});
