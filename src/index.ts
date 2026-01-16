/**
 * yamllint-ts - TypeScript YAML Linter
 * Main entry point
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

// Initialize rules registry (must be imported first)
import './rules/index.js';

// Export core types
export {
  LintProblem,
  type ProblemLevel,
  type Rule,
  type RuleConfig,
  type RuleType,
  type Line,
  type Token,
  type Comment,
  type TokenWithMarks,
  type OutputFormat,
  type CLIOptions,
  ExitCode,
} from './types.js';

// Export configuration
export {
  YamlLintConfig,
  YamlLintConfigError,
  findConfigFile,
  getExtendedConfigFile,
} from './config.js';

// Export linter
export { run, runAll, getSyntaxError, getCosmeticProblems } from './linter.js';

// Export decoder utilities
export { autoDecode, detectEncoding } from './decoder.js';

// Export parser utilities
export {
  lineGenerator,
  tokenOrCommentOrLineGenerator,
  isToken,
  isComment,
  isLine,
  TokenType,
} from './parser.js';

// Export rules
export * as rules from './rules/index.js';

// Version info
export const VERSION = '0.1.0';
export const APP_NAME = 'yamllint-ts';
export const APP_DESCRIPTION = 'A TypeScript YAML linter';
