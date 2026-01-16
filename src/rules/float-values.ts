/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: float-values
 *
 * Limit the permitted values for floating-point numbers.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'float-values';
export const TYPE = 'token' as const;

export const CONF = {
  'require-numeral-before-decimal': Boolean,
  'forbid-scientific-notation': Boolean,
  'forbid-nan': Boolean,
  'forbid-inf': Boolean,
};

export const DEFAULT = {
  'require-numeral-before-decimal': false,
  'forbid-scientific-notation': false,
  'forbid-nan': false,
  'forbid-inf': false,
};

// Pattern for floats missing 0 prefix before decimal (e.g., .0, .5, -.5, +.5e10)
const IS_NUMERAL_BEFORE_DECIMAL_PATTERN = /^[-+]?(\.[0-9]+)([eE][-+]?[0-9]+)?$/;

// Pattern for scientific notation (e.g., 1e10, 1.5E-3, .5e+2)
const IS_SCIENTIFIC_NOTATION_PATTERN = /^[-+]?(\.[0-9]+|[0-9]+(\.[0-9]*)?)([eE][-+]?[0-9]+)$/;

// Pattern for infinity values
const IS_INF_PATTERN = /^[-+]?(\.inf|\.Inf|\.INF)$/;

// Pattern for NaN values
const IS_NAN_PATTERN = /^(\.nan|\.NaN|\.NAN)$/;

/**
 * Check if a scalar is unquoted (plain style).
 */
function isUnquotedScalar(token: TokenWithMarks): boolean {
  if (token.type !== TokenType.Scalar) {
    return false;
  }
  const value = token.value ?? '';
  // Plain scalars don't start with quotes or literal/folded indicators
  if (
    value.startsWith("'") ||
    value.startsWith('"') ||
    value.startsWith('|') ||
    value.startsWith('>')
  ) {
    return false;
  }
  return true;
}

export function* check(
  conf: RuleConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  _context: Record<string, unknown>
): Generator<LintProblem> {
  // Skip if previous token is a tag (explicit typing)
  if (prev?.type === TokenType.Tag) {
    return;
  }

  // Only check unquoted scalars
  if (!isUnquotedScalar(token)) {
    return;
  }

  const val = token.value ?? '';

  if (conf['forbid-nan'] && IS_NAN_PATTERN.test(val)) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.startMark.column + 1,
      `forbidden not a number value "${val}"`
    );
  }

  if (conf['forbid-inf'] && IS_INF_PATTERN.test(val)) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.startMark.column + 1,
      `forbidden infinite value "${val}"`
    );
  }

  if (conf['forbid-scientific-notation'] && IS_SCIENTIFIC_NOTATION_PATTERN.test(val)) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.startMark.column + 1,
      `forbidden scientific notation "${val}"`
    );
  }

  if (conf['require-numeral-before-decimal'] && IS_NUMERAL_BEFORE_DECIMAL_PATTERN.test(val)) {
    yield new LintProblem(
      token.startMark.line + 1,
      token.startMark.column + 1,
      `forbidden decimal missing 0 prefix "${val}"`
    );
  }
}

const rule: Rule = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check: check as Rule['check'],
};

export default rule;
