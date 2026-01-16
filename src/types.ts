/**
 * yamllint-ts - TypeScript YAML Linter
 * Type definitions
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

// No external type imports needed - we define our own types

// =============================================================================
// Problem Levels
// =============================================================================

export type ProblemLevel = 'warning' | 'error';

export const PROBLEM_LEVELS = {
  0: null,
  1: 'warning',
  2: 'error',
  warning: 1,
  error: 2,
} as const;

// =============================================================================
// Lint Problem
// =============================================================================

/**
 * Represents a linting problem found by yamllint.
 */
export class LintProblem {
  /** Line on which the problem was found (1-based) */
  line: number;
  /** Column on which the problem was found (1-based) */
  column: number;
  /** Human-readable description of the problem */
  desc: string;
  /** Identifier of the rule that detected the problem */
  rule: string | null;
  /** Severity level of the problem */
  level: ProblemLevel | null;

  constructor(
    line: number,
    column: number,
    desc: string = '<no description>',
    rule: string | null = null
  ) {
    this.line = line;
    this.column = column;
    this.desc = desc;
    this.rule = rule;
    this.level = null;
  }

  /** Get the full message including rule identifier */
  get message(): string {
    if (this.rule !== null) {
      return `${this.desc} (${this.rule})`;
    }
    return this.desc;
  }

  /** Check equality with another LintProblem */
  equals(other: LintProblem): boolean {
    return (
      this.line === other.line &&
      this.column === other.column &&
      this.rule === other.rule
    );
  }

  /** Compare for sorting (by line, then column) */
  compareTo(other: LintProblem): number {
    if (this.line !== other.line) {
      return this.line - other.line;
    }
    return this.column - other.column;
  }

  toString(): string {
    return `${this.line}:${this.column}: ${this.message}`;
  }
}

// =============================================================================
// Parser Types
// =============================================================================

/**
 * Represents a line in the YAML document.
 */
export interface Line {
  lineNo: number;
  start: number;
  end: number;
  buffer: string;
  content: string;
}

/**
 * Represents position information for a token.
 */
export interface TokenMark {
  line: number;
  column: number;
  pointer: number;
  buffer: string;
}

/**
 * Extended token with position marks (similar to PyYAML tokens).
 */
export interface TokenWithMarks {
  type: string;
  startMark: TokenMark;
  endMark: TokenMark;
  // Additional properties depending on token type
  value?: string;
  anchor?: string;
  tag?: string;
  style?: string;
  plain?: boolean;
}

/**
 * Wrapper around YAML tokens with context (prev, curr, next, nextnext).
 */
export interface Token {
  lineNo: number;
  curr: TokenWithMarks;
  prev: TokenWithMarks | null;
  next: TokenWithMarks | null;
  nextnext: TokenWithMarks | null;
}

/**
 * Represents a comment in the YAML document.
 */
export interface Comment {
  lineNo: number;
  columnNo: number;
  buffer: string;
  pointer: number;
  tokenBefore: TokenWithMarks | null;
  tokenAfter: TokenWithMarks | null;
  commentBefore: Comment | null;
  /** Get the comment content as string */
  content: string;
  /** Check if this is an inline comment */
  isInline(): boolean;
}

/**
 * Union type for elements yielded by the parser.
 */
export type ParsedElement = Token | Comment | Line;

// =============================================================================
// Rule Types
// =============================================================================

/** The type of element a rule checks */
export type RuleType = 'token' | 'comment' | 'line';

/**
 * Configuration option type definitions.
 * - Primitive types: boolean, number (int), string
 * - Tuple: union of allowed values/types
 * - Array: list containing allowed values/types
 */
export type ConfigOptionType =
  | typeof Boolean
  | typeof Number
  | typeof String
  | Array<string | number | boolean | typeof Boolean | typeof Number | typeof String>
  | (string | number | boolean | typeof Boolean | typeof Number | typeof String)[];

/** Configuration schema for a rule */
export type RuleConfigSchema = Record<string, ConfigOptionType>;

/** Default values for rule configuration */
export type RuleConfigDefaults = Record<string, unknown>;

/** Ignore pattern matcher (gitignore-style) */
export interface IgnorePattern {
  /** Check if a file path matches the ignore pattern */
  ignores(filepath: string): boolean;
}

// =============================================================================
// Base Types for Generic Rule System
// =============================================================================

/**
 * Base configuration that all rule configs must extend.
 * Rules can add their own typed properties on top of this.
 */
export interface BaseRuleConfig {
  level: ProblemLevel;
  ignore?: IgnorePattern;
}

/**
 * Base context that all rule contexts must extend.
 * The index signature allows typed contexts to be assigned to Record<string, unknown>.
 */
export interface BaseRuleContext {
  [key: string]: unknown;
}

/**
 * Legacy RuleConfig type - alias for BaseRuleConfig with index signature.
 * Used by rules that haven't been migrated to typed configs yet.
 */
export interface RuleConfig extends BaseRuleConfig {
  [key: string]: unknown;
}

// =============================================================================
// Generic Rule Interface
// =============================================================================

/**
 * Token rule check function with typed config and context.
 */
export type TokenRuleCheck<
  TConfig extends BaseRuleConfig = RuleConfig,
  TContext extends BaseRuleContext = BaseRuleContext
> = (
  conf: TConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  next: TokenWithMarks | null,
  nextnext: TokenWithMarks | null,
  context: TContext
) => Generator<LintProblem>;

/** Check function for comment rules */
export type CommentRuleCheck<TConfig extends BaseRuleConfig = RuleConfig> = (
  conf: TConfig,
  comment: Comment
) => Generator<LintProblem>;

/** Check function for line rules */
export type LineRuleCheck<TConfig extends BaseRuleConfig = RuleConfig> = (
  conf: TConfig,
  line: Line
) => Generator<LintProblem>;

/** Union of all check function types (using base types for storage) */
export type RuleCheckFunction =
  | TokenRuleCheck<RuleConfig, BaseRuleContext>
  | CommentRuleCheck<RuleConfig>
  | LineRuleCheck<RuleConfig>;

/**
 * Rule interface - defines the structure of a linting rule.
 * 
 * Generic parameters allow rules to specify their own typed config and context:
 * - TConfig: The rule's configuration interface (must extend BaseRuleConfig)
 * - TContext: The rule's context interface (must extend BaseRuleContext)
 * 
 * @example
 * // Typed rule with specific config and context
 * const rule: TokenRule<AnchorsConfig, AnchorsContext> = { ... };
 * 
 * // Legacy rule using defaults
 * const rule: Rule = { ... };
 */
export interface Rule<
  TConfig extends BaseRuleConfig = RuleConfig,
  TContext extends BaseRuleContext = BaseRuleContext
> {
  /** Unique identifier for the rule (e.g., 'line-length') */
  ID: string;
  /** Type of element this rule checks */
  TYPE: RuleType;
  /** Configuration options schema */
  CONF?: RuleConfigSchema;
  /** Default values for configuration options */
  DEFAULT?: RuleConfigDefaults;
  /** Optional custom validation function */
  VALIDATE?: (conf: TConfig) => string | null;
  /** The check function - signature depends on TYPE */
  check: TokenRuleCheck<TConfig, TContext> | CommentRuleCheck<TConfig> | LineRuleCheck<TConfig>;
  /** Optional factory to create typed initial context for token rules */
  createContext?: () => TContext;
}

/**
 * Convenience type for token-based rules with typed config and context.
 */
export type TokenRule<
  TConfig extends BaseRuleConfig = RuleConfig,
  TContext extends BaseRuleContext = BaseRuleContext
> = Rule<TConfig, TContext> & { TYPE: 'token'; check: TokenRuleCheck<TConfig, TContext> };

/**
 * Convenience type for comment-based rules with typed config.
 */
export type CommentRule<TConfig extends BaseRuleConfig = RuleConfig> = 
  Rule<TConfig, BaseRuleContext> & { TYPE: 'comment'; check: CommentRuleCheck<TConfig> };

/**
 * Convenience type for line-based rules with typed config.
 */
export type LineRule<TConfig extends BaseRuleConfig = RuleConfig> = 
  Rule<TConfig, BaseRuleContext> & { TYPE: 'line'; check: LineRuleCheck<TConfig> };

// =============================================================================
// Configuration Types
// =============================================================================

/** Raw rule configuration from YAML config file */
export type RawRuleConfig =
  | 'enable'
  | 'disable'
  | boolean
  | Record<string, unknown>;

/** Raw configuration as parsed from YAML */
export interface RawConfig {
  extends?: string;
  rules?: Record<string, RawRuleConfig>;
  ignore?: string | string[];
  'ignore-from-file'?: string | string[];
  'yaml-files'?: string[];
  locale?: string;
}

/** Validated configuration */
export interface YamlLintConfigData {
  rules: Record<string, RuleConfig | false>;
  ignore: IgnorePattern | null;
  yamlFiles: IgnorePattern;
  locale: string | null;
}

// =============================================================================
// Output Formatter Types
// =============================================================================

/** Available output formats */
export type OutputFormat = 'parsable' | 'standard' | 'colored' | 'github' | 'auto';

/** Problem with file information for formatters */
export interface FileProblem {
  filepath: string;
  problem: LintProblem;
}

// =============================================================================
// CLI Types
// =============================================================================

/** CLI options */
export interface CLIOptions {
  configFile?: string;
  configData?: string;
  format: OutputFormat;
  strict: boolean;
  noWarnings: boolean;
  listFiles: boolean;
  files: string[];
}

/** Exit codes matching Python yamllint */
export const ExitCode = {
  OK: 0,
  ERROR: 1,
  WARNING: 2,
} as const;

export type ExitCodeType = (typeof ExitCode)[keyof typeof ExitCode];

// =============================================================================
// Linter Types
// =============================================================================

/** Options for the linter.run() function */
export interface LintOptions {
  /** File path (used for ignore patterns and error messages) */
  filepath?: string;
}

/** Result of linting a single file */
export interface LintResult {
  filepath: string;
  problems: LintProblem[];
}
