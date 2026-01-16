/**
 * yamllint-ts - TypeScript YAML Linter
 * Core linting engine
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { parseAllDocuments, LineCounter } from 'yaml';
import type { YAMLParseError } from 'yaml';
import { autoDecode } from './decoder.js';
import {
  tokenOrCommentOrLineGenerator,
  lineGenerator,
  isToken,
  isComment,
  isLine,
} from './parser.js';
import type { YamlLintConfig } from './config.js';
import {
  LintProblem,
  type RuleConfig,
  type Comment,
  type Token,
  type TokenWithMarks,
} from './types.js';

// =============================================================================
// Directive Patterns
// =============================================================================

const DISABLE_RULE_PATTERN = /^#\s*yamllint\s+disable(\s+rule:\S+)*\s*$/;
const ENABLE_RULE_PATTERN = /^#\s*yamllint\s+enable(\s+rule:\S+)*\s*$/;
const DISABLE_LINE_PATTERN = /^#\s*yamllint\s+disable-line(\s+rule:\S+)*\s*$/;
const DISABLE_FILE_PATTERN = /^#\s*yamllint\s+disable-file\s*$/;

// =============================================================================
// Disable Directive Handler
// =============================================================================

class DisableDirective {
  protected rules: Set<string> = new Set();
  protected allRules: Set<string>;

  constructor(allRuleIds: string[]) {
    this.allRules = new Set(allRuleIds);
  }

  processComment(comment: Comment | string): void {
    const content = typeof comment === 'string' ? comment : comment.content;

    if (DISABLE_RULE_PATTERN.test(content)) {
      // Extract rule names after "yamllint disable"
      const match = content.match(/disable(.*)$/);
      if (match) {
        const rulesStr = match[1]?.trim() || '';
        if (rulesStr === '') {
          // Disable all rules
          this.rules = new Set(this.allRules);
        } else {
          // Disable specific rules
          const ruleMatches = rulesStr.matchAll(/rule:(\S+)/g);
          for (const ruleMatch of ruleMatches) {
            const ruleId = ruleMatch[1];
            if (ruleId && this.allRules.has(ruleId)) {
              this.rules.add(ruleId);
            }
          }
        }
      }
    } else if (ENABLE_RULE_PATTERN.test(content)) {
      // Extract rule names after "yamllint enable"
      const match = content.match(/enable(.*)$/);
      if (match) {
        const rulesStr = match[1]?.trim() || '';
        if (rulesStr === '') {
          // Enable all rules
          this.rules.clear();
        } else {
          // Enable specific rules
          const ruleMatches = rulesStr.matchAll(/rule:(\S+)/g);
          for (const ruleMatch of ruleMatches) {
            const ruleId = ruleMatch[1];
            if (ruleId) {
              this.rules.delete(ruleId);
            }
          }
        }
      }
    }
  }

  isDisabledByDirective(problem: LintProblem): boolean {
    return problem.rule !== null && this.rules.has(problem.rule);
  }
}

class DisableLineDirective extends DisableDirective {
  override processComment(comment: Comment | string): void {
    const content = typeof comment === 'string' ? comment : comment.content;

    if (DISABLE_LINE_PATTERN.test(content)) {
      const match = content.match(/disable-line(.*)$/);
      if (match) {
        const rulesStr = match[1]?.trim() || '';
        if (rulesStr === '') {
          // Disable all rules for this line
          this.rules = new Set(this.allRules);
        } else {
          // Disable specific rules for this line
          const ruleMatches = rulesStr.matchAll(/rule:(\S+)/g);
          for (const ruleMatch of ruleMatches) {
            const ruleId = ruleMatch[1];
            if (ruleId && this.allRules.has(ruleId)) {
              this.rules.add(ruleId);
            }
          }
        }
      }
    }
  }
}

// =============================================================================
// Cosmetic Problems (Rule-based)
// =============================================================================

/**
 * Get cosmetic (style) problems by running all rules.
 */
export function* getCosmeticProblems(
  buffer: string,
  conf: YamlLintConfig,
  filepath: string | null
): Generator<LintProblem> {
  const rules = conf.enabledRules(filepath);

  // Split rules by type
  const tokenRules = rules.filter((r) => r.TYPE === 'token');
  const commentRules = rules.filter((r) => r.TYPE === 'comment');
  const lineRules = rules.filter((r) => r.TYPE === 'line');

  // Context for token rules (persists across tokens)
  const context: Map<string, Record<string, unknown>> = new Map();
  for (const rule of tokenRules) {
    context.set(rule.ID, rule.createContext ? rule.createContext() : {});
  }

  // All rule IDs for directive handling
  const allRuleIds = rules.map((r) => r.ID);

  // Directive handlers
  const disabled = new DisableDirective(allRuleIds);
  let disabledForLine = new DisableLineDirective(allRuleIds);
  let disabledForNextLine = new DisableLineDirective(allRuleIds);

  // Cache problems until end of line
  let cache: LintProblem[] = [];

  for (const elem of tokenOrCommentOrLineGenerator(buffer)) {
    if (isToken(elem)) {
      // Run token rules
      for (const rule of tokenRules) {
        const ruleConf = conf.rules.get(rule.ID);
        if (ruleConf === false) continue;

        const ruleContext = context.get(rule.ID) || {};
        const typedConf = ruleConf as RuleConfig;

        // Call the check function with proper arguments
        const checkGen = rule.check as (
          conf: RuleConfig,
          token: TokenWithMarks,
          prev: TokenWithMarks | null,
          next: TokenWithMarks | null,
          nextnext: TokenWithMarks | null,
          ctx: Record<string, unknown>
        ) => Generator<LintProblem>;

        for (const problem of checkGen(
          typedConf,
          (elem as Token).curr,
          (elem as Token).prev,
          (elem as Token).next,
          (elem as Token).nextnext,
          ruleContext
        )) {
          problem.rule = rule.ID;
          problem.level = typedConf.level;
          cache.push(problem);
        }
      }
    } else if (isComment(elem)) {
      // Run comment rules
      for (const rule of commentRules) {
        const ruleConf = conf.rules.get(rule.ID);
        if (ruleConf === false) continue;

        const typedConf = ruleConf as RuleConfig;

        // Call the check function with proper arguments
        const checkGen = rule.check as (
          conf: RuleConfig,
          comment: typeof elem
        ) => Generator<LintProblem>;

        for (const problem of checkGen(typedConf, elem)) {
          problem.rule = rule.ID;
          problem.level = typedConf.level;
          cache.push(problem);
        }
      }

      // Process directives
      disabled.processComment(elem);
      if (elem.isInline()) {
        disabledForLine.processComment(elem);
      } else {
        disabledForNextLine.processComment(elem);
      }
    } else if (isLine(elem)) {
      // Run line rules
      for (const rule of lineRules) {
        const ruleConf = conf.rules.get(rule.ID);
        if (ruleConf === false) continue;

        const typedConf = ruleConf as RuleConfig;

        // Call the check function with proper arguments
        const checkGen = rule.check as (
          conf: RuleConfig,
          line: typeof elem
        ) => Generator<LintProblem>;

        for (const problem of checkGen(typedConf, elem)) {
          problem.rule = rule.ID;
          problem.level = typedConf.level;
          cache.push(problem);
        }
      }

      // End of line - flush problems (filtered by directives)
      for (const problem of cache) {
        if (
          !disabledForLine.isDisabledByDirective(problem) &&
          !disabled.isDisabledByDirective(problem)
        ) {
          yield problem;
        }
      }

      // Reset for next line
      disabledForLine = disabledForNextLine;
      disabledForNextLine = new DisableLineDirective(allRuleIds);
      cache = [];
    }
  }
}

// =============================================================================
// Syntax Error Detection
// =============================================================================

/**
 * Get syntax error from YAML parsing (if any).
 * Uses parseAllDocuments to correctly handle multi-document YAML.
 * Uses uniqueKeys: false to allow the key-duplicates rule to handle duplicate keys.
 */
export function getSyntaxError(buffer: string): LintProblem | null {
  try {
    const lineCounter = new LineCounter();
    const docs = parseAllDocuments(buffer, {
      lineCounter,
      keepSourceTokens: true,
      uniqueKeys: false, // Let key-duplicates rule handle this
    });

    // Check for errors in all documents
    for (const doc of docs) {
      if (doc.errors.length > 0) {
        const error = doc.errors[0] as YAMLParseError;
        const pos = error.linePos;

        if (pos && pos.length > 0) {
          const problem = new LintProblem(
            pos[0]!.line,
            pos[0]!.col,
            `syntax error: ${error.message}`
          );
          problem.level = 'error';
          return problem;
        } else {
          // No position info, use line 1
          const problem = new LintProblem(1, 1, `syntax error: ${error.message}`);
          problem.level = 'error';
          return problem;
        }
      }
    }

    return null;
  } catch (e) {
    // Parsing failed completely
    const message = e instanceof Error ? e.message : String(e);
    const problem = new LintProblem(1, 1, `syntax error: ${message}`);
    problem.level = 'error';
    return problem;
  }
}

// =============================================================================
// Internal Run Function
// =============================================================================

function* _run(
  buffer: string,
  conf: YamlLintConfig,
  filepath: string | null
): Generator<LintProblem> {
  // Check for disable-file directive on first line
  const firstLine = lineGenerator(buffer).next().value;
  if (firstLine && DISABLE_FILE_PATTERN.test(firstLine.content)) {
    return;
  }

  // Get syntax error (if any) to interleave at the right position
  let syntaxError = getSyntaxError(buffer);

  for (const problem of getCosmeticProblems(buffer, conf, filepath)) {
    // Insert syntax error at the right place
    if (syntaxError && syntaxError.line <= problem.line && syntaxError.column <= problem.column) {
      yield syntaxError;
      // Clear syntax error - we've yielded it
      syntaxError = null;
      // Also skip the current problem if it's at the same position
      // (likely redundant)
      continue;
    }

    yield problem;
  }

  // Yield syntax error if it wasn't inserted above
  if (syntaxError) {
    yield syntaxError;
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Lint a YAML source.
 *
 * @param input - Buffer, string, or readable stream to lint
 * @param conf - YamlLintConfig configuration object
 * @param filepath - Optional file path (for ignore patterns and error messages)
 * @returns Generator of LintProblem objects
 */
export function* run(
  input: Buffer | string,
  conf: YamlLintConfig,
  filepath: string | null = null
): Generator<LintProblem> {
  // Check if file is globally ignored
  if (filepath !== null && conf.isFileIgnored(filepath)) {
    return;
  }

  // Convert Buffer to string if needed
  let buffer: string;
  if (Buffer.isBuffer(input)) {
    buffer = autoDecode(input);
  } else if (typeof input === 'string') {
    buffer = input;
  } else {
    throw new TypeError('input should be a string or Buffer');
  }

  yield* _run(buffer, conf, filepath);
}

/**
 * Lint a YAML source and return all problems as an array.
 *
 * @param input - Buffer or string to lint
 * @param conf - YamlLintConfig configuration object
 * @param filepath - Optional file path
 * @returns Array of LintProblem objects
 */
export function runAll(
  input: Buffer | string,
  conf: YamlLintConfig,
  filepath: string | null = null
): LintProblem[] {
  return [...run(input, conf, filepath)];
}

// =============================================================================
// Re-export LintProblem for convenience
// =============================================================================

export { LintProblem };
