/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: empty-lines
 *
 * Set a limit to consecutive blank lines.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Line } from '../types.js';

export const ID = 'empty-lines';
export const TYPE = 'line' as const;

export const CONF = {
  max: Number,
  'max-start': Number,
  'max-end': Number,
};

export const DEFAULT = {
  max: 2,
  'max-start': 0,
  'max-end': 0,
};

export function* check(conf: RuleConfig, line: Line): Generator<LintProblem> {
  const maxEmpty = conf['max'] as number;
  const maxStart = conf['max-start'] as number;
  const maxEnd = conf['max-end'] as number;

  const lineBuffer = line.buffer;

  // Only check empty lines (start == end means no content)
  if (line.start !== line.end) {
    return;
  }

  // Don't check if this is past the buffer
  if (line.end >= lineBuffer.length) {
    return;
  }

  // Only alert on the LAST blank line of a series
  // Check if the next line is also blank
  const nextTwoChars = lineBuffer.slice(line.end, line.end + 2);
  if (nextTwoChars === '\n\n' || nextTwoChars === '\r\n') {
    // Check for \r\n\r\n (DOS double blank)
    const nextFourChars = lineBuffer.slice(line.end, line.end + 4);
    if (nextFourChars === '\r\n\r\n') {
      return; // Not the last blank line
    }
    if (nextTwoChars === '\n\n') {
      return; // Not the last blank line
    }
  }

  // Count blank lines before this one
  let blankLines = 0;
  let start = line.start;

  // Count preceding \r\n sequences
  while (start >= 2 && lineBuffer.slice(start - 2, start) === '\r\n') {
    blankLines++;
    start -= 2;
  }

  // Count preceding \n characters
  while (start >= 1 && lineBuffer[start - 1] === '\n') {
    blankLines++;
    start--;
  }

  let max = maxEmpty;

  // Special case: start of document
  if (start === 0) {
    blankLines++; // First line doesn't have a preceding \n
    max = maxStart;
  }

  // Special case: end of document
  // The last line of a file should end with a newline (POSIX)
  // Check if this blank line is at the very end
  if (
    (line.end === lineBuffer.length - 1 && lineBuffer[line.end] === '\n') ||
    (line.end === lineBuffer.length - 2 && lineBuffer.slice(line.end, line.end + 2) === '\r\n')
  ) {
    // Allow the exception of a file containing only '\n'
    if (line.end === 0) {
      return;
    }
    max = maxEnd;
  }

  if (blankLines > max) {
    yield new LintProblem(
      line.lineNo,
      1,
      `too many blank lines (${blankLines} > ${max})`
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
