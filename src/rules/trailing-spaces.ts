/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: trailing-spaces
 *
 * Forbid trailing spaces at the end of lines.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Line } from '../types.js';

export const ID = 'trailing-spaces';
export const TYPE = 'line' as const;
export const CONF = {};
export const DEFAULT = {};

export function* check(_conf: RuleConfig, line: Line): Generator<LintProblem> {
  const content = line.content;

  // Skip empty lines
  if (content.length === 0) {
    return;
  }

  // Check for trailing whitespace
  const trimmed = content.trimEnd();
  if (trimmed.length < content.length) {
    yield new LintProblem(
      line.lineNo,
      trimmed.length + 1,
      'trailing spaces'
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
