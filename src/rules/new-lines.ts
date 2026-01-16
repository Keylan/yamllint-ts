/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: new-lines
 *
 * Force the type of new line characters (Unix or DOS).
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Line } from '../types.js';
import * as os from 'os';

export const ID = 'new-lines';
export const TYPE = 'line' as const;

export const CONF = {
  type: ['unix', 'dos', 'platform'],
};

export const DEFAULT = {
  type: 'unix',
};

export function* check(conf: RuleConfig, line: Line): Generator<LintProblem> {
  const buffer = line.buffer;
  const lineEnd = line.end;
  const expectedType = conf['type'] as string;

  // Determine expected line ending
  let expectedEnding: string;
  if (expectedType === 'platform') {
    expectedEnding = os.EOL === '\r\n' ? 'dos' : 'unix';
  } else {
    expectedEnding = expectedType;
  }

  // Check if there's a newline after this line
  // line.end points to just before the line ending characters
  // Check both for \n directly after, or \r\n
  let hasNewline = false;
  let isDos = false;

  if (lineEnd < buffer.length) {
    if (buffer[lineEnd] === '\n') {
      hasNewline = true;
      isDos = false;
    } else if (buffer[lineEnd] === '\r' && lineEnd + 1 < buffer.length && buffer[lineEnd + 1] === '\n') {
      hasNewline = true;
      isDos = true;
    }
  }

  if (hasNewline) {
    if (expectedEnding === 'dos' && !isDos) {
      yield new LintProblem(
        line.lineNo,
        line.content.length + 1,
        'wrong new line character: expected \\r\\n'
      );
    } else if (expectedEnding === 'unix' && isDos) {
      yield new LintProblem(
        line.lineNo,
        line.content.length + 1,
        'wrong new line character: expected \\n'
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
