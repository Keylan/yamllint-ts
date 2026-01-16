/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: new-line-at-end-of-file
 *
 * Require a newline character at the end of files.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Line } from '../types.js';

export const ID = 'new-line-at-end-of-file';
export const TYPE = 'line' as const;
export const CONF = {};
export const DEFAULT = {};

export function* check(_conf: RuleConfig, line: Line): Generator<LintProblem> {
  // Only check the last line
  // The last line ends at buffer.length, and if the file has a trailing newline,
  // the last line will be empty (start === end === buffer.length)

  const buffer = line.buffer;

  // This is the last line if end is at or near buffer length
  if (line.end >= buffer.length) {
    // Check if the buffer ends without a newline
    if (buffer.length > 0 && buffer[buffer.length - 1] !== '\n') {
      yield new LintProblem(
        line.lineNo,
        line.content.length + 1,
        'no new line character at the end of file'
      );
    }
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
