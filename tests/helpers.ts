/**
 * yamllint-ts - TypeScript YAML Linter
 * Test helpers - Ported from Python yamllint tests/common.py
 */

import { expect } from 'vitest';
import { LintProblem } from '../src/types.js';

// Import rules module to initialize the registry
import '../src/rules/index.js';

import { YamlLintConfig } from '../src/config.js';
import { runAll } from '../src/linter.js';

/**
 * Expected problem specification
 * [line, column] or [line, column, rule] where rule can be 'syntax' for syntax errors
 */
export type ProblemSpec = [number, number] | [number, number, string];

/**
 * Build a fake config for testing, matching Python's build_fake_config
 * @param conf - YAML string of rule config or null for defaults
 */
export function buildFakeConfig(conf: string | null): YamlLintConfig {
  let configContent: string;
  if (conf === null) {
    configContent = 'extends: default';
  } else {
    configContent = `extends: default\nrules:\n  ${conf.split('\n').join('\n  ')}`;
  }
  return new YamlLintConfig({ content: configContent });
}

/**
 * Check that linting produces exactly the expected problems
 * Matches Python's RuleTestCase.check() method
 *
 * @param source - YAML source to lint
 * @param conf - Rule configuration string
 * @param ruleId - Default rule ID for problems without explicit rule
 * @param problems - Expected problems as { problem1: [line, col], problem2: [line, col, 'rule'] }
 */
export function check(
  source: string,
  conf: string | null,
  ruleId: string,
  problems: Record<string, ProblemSpec> = {}
): void {
  const config = buildFakeConfig(conf);

  // Build expected problems
  const expectedProblems: Array<{ line: number; column: number; rule: string | null }> = [];
  for (const [key, value] of Object.entries(problems)) {
    if (!key.startsWith('problem')) {
      throw new Error(`Problem key must start with 'problem': ${key}`);
    }
    const [line, column, rule] = value;
    let problemRule: string | null;
    if (rule === 'syntax') {
      problemRule = null;
    } else if (rule !== undefined) {
      problemRule = rule;
    } else {
      problemRule = ruleId;
    }
    expectedProblems.push({ line, column, rule: problemRule });
  }

  // Sort expected problems by line, then column
  expectedProblems.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });

  // Run linter
  const realProblems = runAll(source, config);

  // Sort real problems
  const sortedReal = [...realProblems].sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });

  // Compare
  const realSimplified = sortedReal.map((p) => ({
    line: p.line,
    column: p.column,
    rule: p.rule,
  }));

  expect(realSimplified).toEqual(expectedProblems);
}

/**
 * Helper function to create a rule test checker with a fixed rule ID
 */
export function createRuleChecker(ruleId: string) {
  return (source: string, conf: string | null, problems: Record<string, ProblemSpec> = {}) => {
    check(source, conf, ruleId, problems);
  };
}
