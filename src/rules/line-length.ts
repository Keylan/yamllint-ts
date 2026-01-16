/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: line-length
 *
 * Set a limit to lines length.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type Rule, type RuleConfig, type Line } from '../types.js';

export const ID = 'line-length';
export const TYPE = 'line' as const;

export const CONF = {
  max: Number,
  'allow-non-breakable-words': Boolean,
  'allow-non-breakable-inline-mappings': Boolean,
};

export const DEFAULT = {
  max: 80,
  'allow-non-breakable-words': true,
  'allow-non-breakable-inline-mappings': false,
};

/**
 * Check if the line contains an inline mapping where the value is non-breakable.
 * This checks for patterns like "key: value" where the value part has no spaces.
 */
function checkInlineMapping(content: string): boolean {
  // Look for the pattern: key: value (where value has no internal spaces)
  // The key might have a space (e.g., "long key: value")
  const colonMatch = content.match(/:\s+/);
  if (colonMatch && colonMatch.index !== undefined) {
    const valueStart = colonMatch.index + colonMatch[0].length;
    const valuePart = content.slice(valueStart);
    // If the value part has no spaces, it's non-breakable
    if (!valuePart.includes(' ')) {
      return true;
    }
  }

  return false;
}

export function* check(conf: RuleConfig, line: Line): Generator<LintProblem> {
  const maxLength = conf['max'] as number;
  let allowNonBreakableWords = conf['allow-non-breakable-words'] as boolean;
  const allowNonBreakableInlineMappings = conf['allow-non-breakable-inline-mappings'] as boolean;

  const content = line.content;
  const length = content.length;

  if (length <= maxLength) {
    return;
  }

  // allow-non-breakable-inline-mappings implies allow-non-breakable-words
  if (allowNonBreakableInlineMappings) {
    allowNonBreakableWords = true;
  }

  if (allowNonBreakableWords) {
    // Skip leading whitespace
    let start = 0;
    while (start < content.length && content[start] === ' ') {
      start++;
    }

    if (start !== content.length) {
      // Handle comment lines - skip the # and any following #s plus one space
      if (content[start] === '#') {
        while (start < content.length && content[start] === '#') {
          start++;
        }
        start++; // Skip one space after #
      }
      // Handle list items - skip the - and space
      else if (content[start] === '-') {
        start += 2;
      }

      // If there are NO spaces in the rest of the line, allow it
      // (it's a non-breakable word like a URL)
      if (content.indexOf(' ', start) === -1) {
        return;
      }

      // Check for inline mappings if enabled
      if (allowNonBreakableInlineMappings && checkInlineMapping(content)) {
        return;
      }
    }
  }

  yield new LintProblem(
    line.lineNo,
    maxLength + 1,
    `line too long (${length} > ${maxLength} characters)`
  );
}

const rule: Rule = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check: check as Rule['check'],
};

export default rule;
