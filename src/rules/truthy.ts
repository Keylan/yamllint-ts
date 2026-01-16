/**
 * yamllint-ts - TypeScript YAML Linter
 * Rule: truthy
 *
 * Forbid non-explicitly typed truthy values other than allowed ones.
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { LintProblem, type TokenRule, type BaseRuleConfig, type BaseRuleContext, type TokenWithMarks } from '../types.js';
import { TokenType } from '../parser.js';

export const ID = 'truthy';
export const TYPE = 'token' as const;

// All possible truthy values in YAML 1.1
const TRUTHY_1_1 = [
  'YES', 'Yes', 'yes',
  'NO', 'No', 'no',
  'TRUE', 'True', 'true',
  'FALSE', 'False', 'false',
  'ON', 'On', 'on',
  'OFF', 'Off', 'off',
];

// Truthy values in YAML 1.2 (more restrictive)
const TRUTHY_1_2 = [
  'TRUE', 'True', 'true',
  'FALSE', 'False', 'false',
];

export const CONF = {
  'allowed-values': [...TRUTHY_1_1],
  'check-keys': Boolean,
};

export const DEFAULT = {
  'allowed-values': ['true', 'false'],
  'check-keys': true,
};

// =============================================================================
// Typed Config and Context
// =============================================================================

/** Typed configuration for the truthy rule */
export interface TruthyConfig extends BaseRuleConfig {
  'allowed-values': string[];
  'check-keys': boolean;
}

/** Typed context for the truthy rule */
export interface TruthyContext extends BaseRuleContext {
  yaml_spec_version?: [number, number];
  bad_truthy_values?: Set<string>;
}

/** Factory to create initial context */
export function createContext(): TruthyContext {
  return {};
}

/**
 * Get the YAML spec version from context.
 */
function yamlSpecVersionForDocument(context: TruthyContext): [number, number] {
  return context.yaml_spec_version ?? [1, 1];
}

/**
 * Check if a scalar token is unquoted (plain style).
 */
function isUnquotedScalar(token: TokenWithMarks): boolean {
  if (token.type !== TokenType.Scalar) {
    return false;
  }
  const value = token.value ?? '';
  // Plain scalars don't start with quotes or literal/folded indicators
  if (value.startsWith("'") || value.startsWith('"') ||
      value.startsWith('|') || value.startsWith('>')) {
    return false;
  }
  return true;
}

/**
 * Get the plain value of a scalar (without quotes/indicators).
 */
function getScalarValue(token: TokenWithMarks): string {
  const value = token.value ?? '';
  // For plain scalars, the value is as-is
  // For quoted scalars, we'd need to strip quotes, but those are filtered out
  return value;
}

export function* check(
  conf: TruthyConfig,
  token: TokenWithMarks,
  prev: TokenWithMarks | null,
  _next: TokenWithMarks | null,
  _nextnext: TokenWithMarks | null,
  context: TruthyContext
): Generator<LintProblem> {
  // Track YAML spec version from directives
  if (token.type === TokenType.Directive && token.value?.startsWith('%YAML')) {
    const match = token.value.match(/%YAML\s+(\d+)\.(\d+)/);
    if (match) {
      context.yaml_spec_version = [parseInt(match[1]!, 10), parseInt(match[2]!, 10)];
    }
  } else if (token.type === TokenType.DocumentEnd) {
    // Reset context at document end
    delete context.yaml_spec_version;
    delete context.bad_truthy_values;
  }

  // Skip if previous token is a tag (explicit typing)
  if (prev?.type === TokenType.Tag) {
    return;
  }

  // Skip keys if check-keys is false
  const checkKeys = conf['check-keys'];
  if (!checkKeys && prev?.type === TokenType.Key && token.type === TokenType.Scalar) {
    return;
  }

  // Only check unquoted scalars
  if (!isUnquotedScalar(token)) {
    return;
  }

  // Build set of bad truthy values if not already done
  if (!context.bad_truthy_values) {
    const specVersion = yamlSpecVersionForDocument(context);
    const baseValues = specVersion[0] === 1 && specVersion[1] === 2 ? TRUTHY_1_2 : TRUTHY_1_1;
    const allowedValues = conf['allowed-values'];
    const allowedSet = new Set(allowedValues);
    context.bad_truthy_values = new Set(baseValues.filter(v => !allowedSet.has(v)));
  }

  const badValues = context.bad_truthy_values;
  const scalarValue = getScalarValue(token);

  if (badValues.has(scalarValue)) {
    const allowedValues = conf['allowed-values'];
    yield new LintProblem(
      token.startMark.line + 1,
      token.startMark.column + 1,
      `truthy value should be one of [${[...allowedValues].sort().join(', ')}]`
    );
  }
}

const rule: TokenRule<TruthyConfig, TruthyContext> = {
  ID,
  TYPE,
  CONF,
  DEFAULT,
  check,
  createContext,
};

export default rule;
