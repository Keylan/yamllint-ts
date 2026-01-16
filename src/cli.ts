#!/usr/bin/env node

/**
 * yamllint-ts - TypeScript YAML Linter
 * Command Line Interface
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { program } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { LintProblem } from './linter.js';
import { run } from './linter.js';
import { YamlLintConfig, YamlLintConfigError } from './config.js';
// Import rules to ensure they are registered before config is used
import './rules/index.js';

// =============================================================================
// Constants
// =============================================================================

const APP_NAME = 'yamllint-ts';
const APP_VERSION = '0.1.0';
const APP_DESCRIPTION = 'A TypeScript YAML linter with feature parity to yamllint (Python)';

const PROBLEM_LEVELS: Record<string, number> = {
  error: 2,
  warning: 1,
};

// =============================================================================
// File Finding
// =============================================================================

/**
 * Find all YAML files recursively.
 */
function* findFilesRecursively(items: string[], conf: YamlLintConfig): Generator<string> {
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

/**
 * Walk a directory recursively.
 */
function* walkDirectory(dir: string): Generator<string> {
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

// =============================================================================
// Output Formatting
// =============================================================================

/**
 * Check if terminal supports colors.
 */
function supportsColor(): boolean {
  if (process.platform === 'win32') {
    return 'ANSICON' in process.env || process.env.TERM === 'ANSI';
  }
  return process.stdout.isTTY === true;
}

/**
 * Format functions for different output styles.
 */
const Format = {
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

// =============================================================================
// Problem Display
// =============================================================================

/**
 * Show problems for a file.
 */
function showProblems(
  problems: Generator<LintProblem>,
  file: string,
  format: string,
  noWarn: boolean
): number {
  let maxLevel = 0;
  let first = true;

  // Auto-detect format
  let effectiveFormat = format;
  if (format === 'auto') {
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_WORKFLOW) {
      effectiveFormat = 'github';
    } else if (supportsColor()) {
      effectiveFormat = 'colored';
    } else {
      effectiveFormat = 'standard';
    }
  }

  for (const problem of problems) {
    const level = PROBLEM_LEVELS[problem.level ?? 'error'] ?? 0;
    maxLevel = Math.max(maxLevel, level);

    // Skip warnings if --no-warnings
    if (noWarn && problem.level !== 'error') {
      continue;
    }

    if (effectiveFormat === 'parsable') {
      console.log(Format.parsable(problem, file));
    } else if (effectiveFormat === 'github') {
      if (first) {
        console.log(`::group::${file}`);
        first = false;
      }
      console.log(Format.github(problem, file));
    } else if (effectiveFormat === 'colored') {
      if (first) {
        console.log(chalk.underline(file));
        first = false;
      }
      console.log(Format.standardColor(problem, file));
    } else {
      // standard
      if (first) {
        console.log(file);
        first = false;
      }
      console.log(Format.standard(problem, file));
    }
  }

  // End github group
  if (!first && effectiveFormat === 'github') {
    console.log('::endgroup::');
  }

  // Add blank line after file (except for parsable)
  if (!first && effectiveFormat !== 'parsable') {
    console.log('');
  }

  return maxLevel;
}

// =============================================================================
// Configuration Finding
// =============================================================================

/**
 * Find project configuration file.
 */
function findProjectConfigFilepath(startPath: string = '.'): string | null {
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
function getUserGlobalConfigPath(): string {
  if (process.env.YAMLLINT_CONFIG_FILE) {
    return path.resolve(process.env.YAMLLINT_CONFIG_FILE);
  }

  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'yamllint', 'config');
  }

  return path.join(os.homedir(), '.config', 'yamllint', 'config');
}

// =============================================================================
// Main CLI
// =============================================================================

async function main(): Promise<void> {
  program
    .name(APP_NAME)
    .description(APP_DESCRIPTION)
    .version(APP_VERSION, '-v, --version')
    .argument('[files...]', 'files or directories to lint')
    .option('-c, --config-file <file>', 'path to a custom configuration')
    .option('-d, --config-data <yaml>', 'custom configuration (as YAML source)')
    .option('--list-files', 'list files to lint and exit')
    .option(
      '-f, --format <format>',
      'format for parsing output (parsable, standard, colored, github, auto)',
      'auto'
    )
    .option('-s, --strict', 'return non-zero exit code on warnings as well as errors')
    .option('--no-warnings', 'output only error level problems')
    .option('--stdin', 'read from standard input')
    .parse(process.argv);

  const options = program.opts();
  const files = program.args;

  // Validate arguments
  if (!options.stdin && files.length === 0) {
    console.error('Error: No files specified. Use --stdin to read from stdin.');
    process.exit(1);
  }

  // Load configuration
  let conf: YamlLintConfig;

  try {
    if (options.configData) {
      let configData = options.configData;
      // If config data doesn't contain ':', treat it as an extends reference
      if (configData !== '' && !configData.includes(':')) {
        configData = `extends: ${configData}`;
      }
      conf = new YamlLintConfig(configData);
    } else if (options.configFile) {
      conf = YamlLintConfig.fromFile(options.configFile);
    } else {
      // Try to find project config
      const projectConfig = findProjectConfigFilepath();
      if (projectConfig) {
        conf = YamlLintConfig.fromFile(projectConfig);
      } else {
        // Try user global config
        const userConfig = getUserGlobalConfigPath();
        if (fs.existsSync(userConfig)) {
          conf = YamlLintConfig.fromFile(userConfig);
        } else {
          // Use default config
          conf = new YamlLintConfig('extends: default');
        }
      }
    }
  } catch (e) {
    if (e instanceof YamlLintConfigError) {
      console.error(`Configuration error: ${e.message}`);
    } else {
      console.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
    process.exit(1);
  }

  // List files mode
  if (options.listFiles) {
    for (const file of findFilesRecursively(files, conf)) {
      if (!conf.isFileIgnored(file)) {
        console.log(file);
      }
    }
    process.exit(0);
  }

  let maxLevel = 0;

  // Lint files
  for (const file of findFilesRecursively(files, conf)) {
    const filepath = file.replace(/^\.\//, '');

    try {
      const content = fs.readFileSync(file);
      const problems = run(content, conf, filepath);
      const level = showProblems(problems, file, options.format, options.noWarnings);
      maxLevel = Math.max(maxLevel, level);
    } catch (e) {
      console.error(`Error reading ${file}: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  }

  // Read from stdin
  if (options.stdin) {
    try {
      const chunks: Buffer[] = [];

      // Read all data from stdin
      for await (const chunk of process.stdin) {
        chunks.push(Buffer.from(chunk));
      }

      const content = Buffer.concat(chunks);
      const problems = run(content, conf, null);
      const level = showProblems(problems, 'stdin', options.format, options.noWarnings);
      maxLevel = Math.max(maxLevel, level);
    } catch (e) {
      console.error(`Error reading stdin: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    }
  }

  // Exit code
  if (maxLevel === PROBLEM_LEVELS['error']) {
    process.exit(1);
  } else if (maxLevel === PROBLEM_LEVELS['warning']) {
    process.exit(options.strict ? 2 : 0);
  } else {
    process.exit(0);
  }
}

// Run CLI
main().catch((e) => {
  console.error(`Fatal error: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
