/**
 * yamllint-ts - TypeScript YAML Linter
 * CLI Utility Functions (testable without subprocess)
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { LintProblem } from './linter.js';
import type { YamlLintConfig } from './config.js';

// =============================================================================
// Constants
// =============================================================================

export const APP_NAME = 'yamllint-ts';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'A TypeScript YAML linter with feature parity to yamllint (Python)';

export const PROBLEM_LEVELS: Record<string, number> = {
  error: 2,
  warning: 1,
};

// =============================================================================
// File Finding
// =============================================================================

/**
 * Walk a directory recursively.
 */
export function* walkDirectory(dir: string): Generator<string> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

/**
 * Find all YAML files recursively.
 */
export function* findFilesRecursively(items: string[], conf: YamlLintConfig): Generator<string> {
  for (const item of items) {
    const stat = fs.statSync(item, { throwIfNoEntry: false });

    if (stat?.isDirectory()) {
      // Recursively walk directory
      for (const entry of walkDirectory(item)) {
        if (conf.isYamlFile(entry) && !conf.isFileIgnored(entry)) {
          yield entry;
        }
      }
    } else if (stat?.isFile()) {
      yield item;
    }
  }
}

// =============================================================================
// Output Formatting
// =============================================================================

/**
 * Check if terminal supports colors.
 */
export function supportsColor(): boolean {
  if (process.platform === 'win32') {
    return 'ANSICON' in process.env || process.env.TERM === 'ANSI';
  }
  return process.stdout.isTTY === true;
}

/**
 * Format functions for different output styles.
 */
export const Format = {
  parsable(problem: LintProblem, filename: string): string {
    return `${filename}:${problem.line}:${problem.column}: [${problem.level}] ${problem.message}`;
  },

  standard(problem: LintProblem, _filename: string): string {
    let line = `  ${problem.line}:${problem.column}`;
    line = line.padEnd(12);
    line += problem.level;
    line = line.padEnd(21);
    line += problem.desc;
    if (problem.rule) {
      line += `  (${problem.rule})`;
    }
    return line;
  },

  standardColor(problem: LintProblem, _filename: string): string {
    let line = `  ${chalk.dim(`${problem.line}:${problem.column}`)}`;
    // Add padding (accounting for ANSI codes)
    const visibleLen = `  ${problem.line}:${problem.column}`.length;
    line += ' '.repeat(Math.max(12 - visibleLen, 0));

    if (problem.level === 'warning') {
      line += chalk.yellow(problem.level);
    } else {
      line += chalk.red(problem.level);
    }

    // Add padding after level
    line += ' '.repeat(Math.max(9 - problem.level!.length, 0));
    line += problem.desc;

    if (problem.rule) {
      line += `  ${chalk.dim(`(${problem.rule})`)}`;
    }
    return line;
  },

  github(problem: LintProblem, filename: string): string {
    let line = `::${problem.level} file=${filename},line=${problem.line},col=${problem.column}`;
    line += `::${problem.line}:${problem.column} `;
    if (problem.rule) {
      line += `[${problem.rule}] `;
    }
    line += problem.desc;
    return line;
  },
};

/**
 * Determine effective format based on environment.
 */
export function getEffectiveFormat(format: string): string {
  if (format === 'auto') {
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_WORKFLOW) {
      return 'github';
    } else if (supportsColor()) {
      return 'colored';
    } else {
      return 'standard';
    }
  }
  return format;
}

/**
 * Format a single problem for output.
 */
export function formatProblem(problem: LintProblem, filename: string, format: string): string {
  const effectiveFormat = getEffectiveFormat(format);

  if (effectiveFormat === 'parsable') {
    return Format.parsable(problem, filename);
  } else if (effectiveFormat === 'github') {
    return Format.github(problem, filename);
  } else if (effectiveFormat === 'colored') {
    return Format.standardColor(problem, filename);
  } else {
    return Format.standard(problem, filename);
  }
}

// =============================================================================
// Configuration Finding
// =============================================================================

/**
 * Find project configuration file.
 */
export function findProjectConfigFilepath(startPath: string = '.'): string | null {
  const configNames = ['.yamllint', '.yamllint.yaml', '.yamllint.yml'];

  let currentPath = path.resolve(startPath);
  const homePath = os.homedir();
  const rootPath = path.parse(currentPath).root;

  while (currentPath !== homePath && currentPath !== rootPath) {
    for (const configName of configNames) {
      const configPath = path.join(currentPath, configName);
      if (fs.existsSync(configPath) && fs.statSync(configPath).isFile()) {
        return configPath;
      }
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }

  return null;
}

/**
 * Get user global config path.
 */
export function getUserGlobalConfigPath(): string {
  if (process.env.YAMLLINT_CONFIG_FILE) {
    return path.resolve(process.env.YAMLLINT_CONFIG_FILE);
  }

  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'yamllint', 'config');
  }

  return path.join(os.homedir(), '.config', 'yamllint', 'config');
}
