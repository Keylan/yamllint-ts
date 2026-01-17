/**
 * yamllint-ts - TypeScript YAML Linter
 * Linter Tests
 */

import { describe, it, expect } from 'vitest';

// Import rules module to initialize the registry
import '../src/rules/index.js';

import { run, runAll, getSyntaxError, getCosmeticProblems, LintProblem } from '../src/linter.js';
import { YamlLintConfig } from '../src/config.js';

describe('linter', () => {
  describe('LintProblem', () => {
    it('should create a problem with line, column, and message', () => {
      const problem = new LintProblem(1, 5, 'test message');
      expect(problem.line).toBe(1);
      expect(problem.column).toBe(5);
      expect(problem.message).toBe('test message');
      expect(problem.rule).toBeNull();
      expect(problem.level).toBeNull();
    });

    it('should allow setting rule and level', () => {
      const problem = new LintProblem(2, 10, 'another message');
      problem.rule = 'indentation';
      problem.level = 'warning';
      expect(problem.rule).toBe('indentation');
      expect(problem.level).toBe('warning');
    });
  });

  describe('getSyntaxError', () => {
    it('should return null for valid YAML', () => {
      const result = getSyntaxError('key: value\n');
      expect(result).toBeNull();
    });

    it('should return null for valid multi-document YAML', () => {
      const result = getSyntaxError('---\nfoo: bar\n---\nbaz: qux\n');
      expect(result).toBeNull();
    });

    it('should return error for invalid YAML', () => {
      const result = getSyntaxError('key: value: invalid\n');
      expect(result).not.toBeNull();
      expect(result!.message).toContain('syntax error');
      expect(result!.level).toBe('error');
    });

    it('should return error with position info', () => {
      const result = getSyntaxError('foo:\n  bar: baz\n qux: bad indent\n');
      expect(result).not.toBeNull();
      expect(result!.line).toBeGreaterThan(0);
    });

    it('should handle completely malformed YAML', () => {
      // Unmatched brackets
      const result = getSyntaxError('[unclosed\n');
      expect(result).not.toBeNull();
      expect(result!.message).toContain('syntax error');
    });

    it('should allow duplicate keys (handled by rule)', () => {
      // uniqueKeys: false should allow this to parse
      const result = getSyntaxError('key: value1\nkey: value2\n');
      expect(result).toBeNull();
    });
  });

  describe('run', () => {
    it('should return no problems for valid YAML with relaxed config', () => {
      const config = new YamlLintConfig('extends: relaxed');
      const problems = [...run('---\nkey: value\n', config)];
      expect(problems).toHaveLength(0);
    });

    it('should accept string input', () => {
      const config = new YamlLintConfig('extends: relaxed');
      const problems = [...run('key: value\n', config)];
      expect(Array.isArray(problems)).toBe(true);
    });

    it('should accept Buffer input', () => {
      const config = new YamlLintConfig('extends: relaxed');
      const buffer = Buffer.from('key: value\n', 'utf-8');
      const problems = [...run(buffer, config)];
      expect(Array.isArray(problems)).toBe(true);
    });

    it('should throw for invalid input type', () => {
      const config = new YamlLintConfig('extends: relaxed');
      // @ts-expect-error - testing invalid input
      expect(() => [...run(123, config)]).toThrow(TypeError);
    });

    it('should skip globally ignored files', () => {
      const config = new YamlLintConfig(`
extends: default
ignore: |
  *.ignored.yaml
`);
      const problems = [...run('invalid: yaml: content\n', config, 'test.ignored.yaml')];
      expect(problems).toHaveLength(0);
    });

    it('should lint non-ignored files', () => {
      const config = new YamlLintConfig(`
extends: default
ignore: |
  *.ignored.yaml
`);
      const problems = [...run('key: value\n', config, 'test.yaml')];
      // May have problems depending on default rules, but should process the file
      expect(Array.isArray(problems)).toBe(true);
    });

    it('should detect trailing spaces', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
      const problems = [...run('key: value   \n', config)];
      expect(problems.some((p) => p.rule === 'trailing-spaces')).toBe(true);
    });

    it('should detect line length issues', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  line-length:
    max: 20
`);
      const longLine = 'key: this is a very long value that exceeds the limit\n';
      const problems = [...run(longLine, config)];
      expect(problems.some((p) => p.rule === 'line-length')).toBe(true);
    });

    it('should include filepath in enabled rules check', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces:
    ignore: |
      ignored.yaml
`);
      // File is ignored for trailing-spaces rule
      const problems = [...run('key: value   \n', config, 'ignored.yaml')];
      const trailingSpaceProblems = problems.filter((p) => p.rule === 'trailing-spaces');
      expect(trailingSpaceProblems).toHaveLength(0);
    });
  });

  describe('runAll', () => {
    it('should return array of problems', () => {
      const config = new YamlLintConfig('extends: relaxed');
      const problems = runAll('key: value\n', config);
      expect(Array.isArray(problems)).toBe(true);
    });

    it('should return same results as run', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
      const yaml = 'key: value   \n';
      const runProblems = [...run(yaml, config)];
      const runAllProblems = runAll(yaml, config);
      expect(runAllProblems).toEqual(runProblems);
    });
  });

  describe('getCosmeticProblems', () => {
    it('should run token rules', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  colons:
    max-spaces-before: 0
`);
      const problems = [...getCosmeticProblems('key : value\n', config, null)];
      expect(problems.some((p) => p.rule === 'colons')).toBe(true);
    });

    it('should run line rules', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  line-length:
    max: 10
`);
      const problems = [...getCosmeticProblems('key: very long value\n', config, null)];
      expect(problems.some((p) => p.rule === 'line-length')).toBe(true);
    });

    it('should run comment rules', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  comments:
    min-spaces-from-content: 2
`);
      const problems = [...getCosmeticProblems('key: value #comment\n', config, null)];
      expect(problems.some((p) => p.rule === 'comments')).toBe(true);
    });
  });

  describe('disable directives', () => {
    describe('yamllint disable', () => {
      it('should disable all rules with yamllint disable', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable
key: value   
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(0);
      });

      it('should disable specific rule with yamllint disable rule:name', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
  line-length:
    max: 20
`);
        const yaml = `# yamllint disable rule:trailing-spaces
key: value   
very-long-key: this line is too long
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(0);
        expect(problems.filter((p) => p.rule === 'line-length').length).toBeGreaterThan(0);
      });

      it('should re-enable rules with yamllint enable', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable
key1: value   
# yamllint enable
key2: value   
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });

      it('should re-enable specific rule with yamllint enable rule:name', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable rule:trailing-spaces
key1: value   
# yamllint enable rule:trailing-spaces
key2: value   
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });

      it('should handle multiple rules in disable directive', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
  line-length:
    max: 20
`);
        const yaml = `# yamllint disable rule:trailing-spaces rule:line-length
key: value that is way too long   
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(0);
        expect(problems.filter((p) => p.rule === 'line-length')).toHaveLength(0);
      });
    });

    describe('yamllint disable-line', () => {
      it('should disable all rules for current line (inline comment)', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `key1: value    # yamllint disable-line
key2: value   
`;
        const problems = runAll(yaml, config);
        // Only key2 should have trailing-spaces issue
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });

      it('should disable specific rule for current line', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `key1: value    # yamllint disable-line rule:trailing-spaces
key2: value   
`;
        const problems = runAll(yaml, config);
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });

      it('should disable for next line (non-inline comment)', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable-line
key1: value   
key2: value   
`;
        const problems = runAll(yaml, config);
        // key1 should be disabled, key2 should have issue
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });
    });

    describe('yamllint disable-file', () => {
      it('should disable all linting for the entire file', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable-file
key1: value   
key2: value   
key3: value   
`;
        const problems = runAll(yaml, config);
        expect(problems).toHaveLength(0);
      });

      it('should only work on first line', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `key1: value
# yamllint disable-file
key2: value   
`;
        const problems = runAll(yaml, config);
        // disable-file not on first line, so it doesn't apply
        expect(problems.filter((p) => p.rule === 'trailing-spaces').length).toBeGreaterThan(0);
      });
    });

    describe('directive edge cases', () => {
      it('should ignore unknown rules in disable directive', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
        const yaml = `# yamllint disable rule:unknown-rule
key: value   
`;
        const problems = runAll(yaml, config);
        // trailing-spaces should still be active
        expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(1);
      });

      it('should handle empty enable (re-enable all)', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
  line-length:
    max: 20
`);
        const yaml = `# yamllint disable rule:trailing-spaces rule:line-length
key1: very long value with trailing   
# yamllint enable
key2: very long value with trailing   
`;
        const problems = runAll(yaml, config);
        // key2 should have both issues
        const key2Problems = problems.filter((p) => p.line === 4);
        expect(key2Problems.some((p) => p.rule === 'trailing-spaces')).toBe(true);
        expect(key2Problems.some((p) => p.rule === 'line-length')).toBe(true);
      });
    });
  });

  describe('syntax error interleaving', () => {
    it('should yield syntax error at correct position', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
      // First line has trailing space, second line has syntax error
      const yaml = `key1: value   
key2: value: invalid
`;
      const problems = runAll(yaml, config);
      // Should have both trailing-spaces and syntax error
      expect(problems.some((p) => p.rule === 'trailing-spaces')).toBe(true);
      expect(problems.some((p) => p.message?.includes('syntax error'))).toBe(true);
    });

    it('should yield syntax error even with no cosmetic problems', () => {
      const config = new YamlLintConfig('extends: relaxed');
      const yaml = 'key: value: invalid\n';
      const problems = runAll(yaml, config);
      expect(problems.some((p) => p.message?.includes('syntax error'))).toBe(true);
    });
  });

  describe('rule configuration', () => {
    it('should respect disabled rules', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: disable
`);
      const yaml = 'key: value   \n';
      const problems = runAll(yaml, config);
      expect(problems.filter((p) => p.rule === 'trailing-spaces')).toHaveLength(0);
    });

    it('should set problem level from rule config', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces:
    level: warning
`);
      const yaml = 'key: value   \n';
      const problems = runAll(yaml, config);
      const trailingProblems = problems.filter((p) => p.rule === 'trailing-spaces');
      expect(trailingProblems.length).toBeGreaterThan(0);
      expect(trailingProblems[0]!.level).toBe('warning');
    });

    it('should use error level by default', () => {
      const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: enable
`);
      const yaml = 'key: value   \n';
      const problems = runAll(yaml, config);
      const trailingProblems = problems.filter((p) => p.rule === 'trailing-spaces');
      expect(trailingProblems.length).toBeGreaterThan(0);
      expect(trailingProblems[0]!.level).toBe('error');
    });
  });
});
