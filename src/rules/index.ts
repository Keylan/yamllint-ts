/**
 * yamllint-ts - TypeScript YAML Linter
 * Rules registry
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import type { Rule } from '../types.js';
import { setRuleRegistry } from '../config.js';

// Import all rules
// Line-based rules
import trailingSpaces from './trailing-spaces.js';
import newLineAtEndOfFile from './new-line-at-end-of-file.js';
import newLines from './new-lines.js';
import lineLength from './line-length.js';
import emptyLines from './empty-lines.js';

// Comment-based rules
import comments from './comments.js';
import commentsIndentation from './comments-indentation.js';

// Token-based rules
import braces from './braces.js';
import brackets from './brackets.js';
import colons from './colons.js';
import commas from './commas.js';
import hyphens from './hyphens.js';
import documentStart from './document-start.js';
import documentEnd from './document-end.js';
import emptyValues from './empty-values.js';
import truthy from './truthy.js';
import octalValues from './octal-values.js';
import floatValues from './float-values.js';
import keyDuplicates from './key-duplicates.js';
import anchors from './anchors.js';
import keyOrdering from './key-ordering.js';
import quotedStrings from './quoted-strings.js';
import indentation from './indentation.js';

// Rule registry - uses Rule<any, any> to allow typed rules with specific configs/contexts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rules = new Map<string, Rule<any, any>>();

// Register all rules - accepts any Rule variant
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerRule(rule: Rule<any, any>): void {
  rules.set(rule.ID, rule);
}

// Register implemented rules
// Line-based
registerRule(trailingSpaces);
registerRule(newLineAtEndOfFile);
registerRule(newLines);
registerRule(lineLength);
registerRule(emptyLines);

// Comment-based
registerRule(comments);
registerRule(commentsIndentation);

// Token-based
registerRule(braces);
registerRule(brackets);
registerRule(colons);
registerRule(commas);
registerRule(hyphens);
registerRule(documentStart);
registerRule(documentEnd);
registerRule(emptyValues);
registerRule(truthy);
registerRule(octalValues);
registerRule(floatValues);
registerRule(keyDuplicates);
registerRule(anchors);
registerRule(keyOrdering);
registerRule(quotedStrings);
registerRule(indentation);

// Initialize the config module with the rule registry
setRuleRegistry(rules);

/**
 * Get a rule by its ID.
 */
export function get(id: string): Rule {
  const rule = rules.get(id);
  if (!rule) {
    throw new Error(`no such rule: "${id}"`);
  }
  return rule;
}

/**
 * Get all registered rule IDs.
 */
export function getAllIds(): string[] {
  return Array.from(rules.keys());
}

/**
 * Get all registered rules.
 */
export function getAll(): Rule[] {
  return Array.from(rules.values());
}

/**
 * Check if a rule exists.
 */
export function exists(id: string): boolean {
  return rules.has(id);
}

// Export individual rules for direct access
export {
  trailingSpaces,
  newLineAtEndOfFile,
  newLines,
  lineLength,
  emptyLines,
  comments,
  commentsIndentation,
  braces,
  brackets,
  colons,
  commas,
  hyphens,
  documentStart,
  documentEnd,
  emptyValues,
  truthy,
  octalValues,
  floatValues,
  keyDuplicates,
  anchors,
  keyOrdering,
  quotedStrings,
  indentation,
};
