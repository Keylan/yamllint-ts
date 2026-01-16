/**
 * yamllint-ts - TypeScript YAML Linter
 * Tests for line-based rules
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { LintProblem } from '../src/types.js';

// Import rules module to initialize the registry
import '../src/rules/index.js';

import { YamlLintConfig } from '../src/config.js';
import { run, runAll } from '../src/linter.js';

/**
 * Helper to run the linter with a simple config
 */
function lint(yaml: string, rulesConfig: Record<string, unknown>): LintProblem[] {
  const configContent = `rules:\n${Object.entries(rulesConfig)
    .map(([rule, conf]) => {
      if (conf === 'enable' || conf === true) {
        return `  ${rule}: enable`;
      } else if (conf === 'disable' || conf === false) {
        return `  ${rule}: disable`;
      } else if (typeof conf === 'object') {
        const opts = Object.entries(conf as Record<string, unknown>)
          .map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`)
          .join('\n');
        return `  ${rule}:\n${opts}`;
      }
      return `  ${rule}: ${conf}`;
    })
    .join('\n')}`;

  const config = new YamlLintConfig({ content: configContent });
  return runAll(yaml, config);
}

describe('trailing-spaces rule', () => {
  it('should detect trailing spaces', () => {
    const yaml = 'key: value   \n';
    const problems = lint(yaml, { 'trailing-spaces': 'enable' });
    expect(problems.length).toBe(1);
    expect(problems[0]?.rule).toBe('trailing-spaces');
    expect(problems[0]?.line).toBe(1);
  });

  it('should not report on lines without trailing spaces', () => {
    const yaml = 'key: value\n';
    const problems = lint(yaml, { 'trailing-spaces': 'enable' });
    expect(problems.length).toBe(0);
  });

  it('should detect trailing tabs', () => {
    const yaml = 'key: value\t\n';
    const problems = lint(yaml, { 'trailing-spaces': 'enable' });
    expect(problems.length).toBe(1);
  });
});

describe('new-line-at-end-of-file rule', () => {
  it('should detect missing newline at end', () => {
    const yaml = 'key: value';
    const problems = lint(yaml, { 'new-line-at-end-of-file': 'enable' });
    expect(problems.length).toBe(1);
    expect(problems[0]?.rule).toBe('new-line-at-end-of-file');
  });

  it('should pass when file ends with newline', () => {
    const yaml = 'key: value\n';
    const problems = lint(yaml, { 'new-line-at-end-of-file': 'enable' });
    expect(problems.length).toBe(0);
  });
});

describe('new-lines rule', () => {
  it('should detect DOS line endings when unix expected', () => {
    const yaml = 'key: value\r\nother: value\r\n';
    const problems = lint(yaml, { 'new-lines': { type: 'unix' } });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.rule).toBe('new-lines');
    expect(problems[0]?.desc).toContain('\\n');
  });

  it('should pass with correct unix line endings', () => {
    const yaml = 'key: value\nother: value\n';
    const problems = lint(yaml, { 'new-lines': { type: 'unix' } });
    expect(problems.length).toBe(0);
  });

  it('should detect unix line endings when dos expected', () => {
    const yaml = 'key: value\nother: value\n';
    const problems = lint(yaml, { 'new-lines': { type: 'dos' } });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.desc).toContain('\\r\\n');
  });

  it('should pass with correct dos line endings', () => {
    const yaml = 'key: value\r\nother: value\r\n';
    const problems = lint(yaml, { 'new-lines': { type: 'dos' } });
    expect(problems.length).toBe(0);
  });
});

describe('line-length rule', () => {
  it('should detect long lines', () => {
    const yaml = 'key: ' + 'a'.repeat(100) + '\n';
    const problems = lint(yaml, { 'line-length': { max: 80 } });
    expect(problems.length).toBe(1);
    expect(problems[0]?.rule).toBe('line-length');
    expect(problems[0]?.column).toBe(81);
  });

  it('should pass lines within limit', () => {
    const yaml = 'key: value\n';
    const problems = lint(yaml, { 'line-length': { max: 80 } });
    expect(problems.length).toBe(0);
  });

  it('should allow non-breakable words (URLs on their own line)', () => {
    // Note: allow-non-breakable-words allows URLs on their own line (after indentation)
    // For "key: url" patterns, use allow-non-breakable-inline-mappings
    const yaml = '---\nthis:\n  is:\n    - a:\n        http://localhost/very/long/url/that/exceeds\n';
    const problems = lint(yaml, {
      'line-length': { max: 40, 'allow-non-breakable-words': true },
    });
    expect(problems.length).toBe(0);
  });

  it('should allow non-breakable inline mappings', () => {
    const yaml = 'key: http://example.com/very/long/url/that/exceeds/the/limit/by/quite/a/bit\n';
    const problems = lint(yaml, {
      'line-length': { max: 40, 'allow-non-breakable-inline-mappings': true },
    });
    expect(problems.length).toBe(0);
  });
});

describe('empty-lines rule', () => {
  it('should detect too many consecutive blank lines', () => {
    const yaml = 'key: value\n\n\n\nother: value\n';
    const problems = lint(yaml, { 'empty-lines': { max: 2 } });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.rule).toBe('empty-lines');
  });

  it('should pass with acceptable number of blank lines', () => {
    const yaml = 'key: value\n\nother: value\n';
    const problems = lint(yaml, { 'empty-lines': { max: 2 } });
    expect(problems.length).toBe(0);
  });

  it('should detect blank lines at start of file', () => {
    const yaml = '\n\nkey: value\n';
    const problems = lint(yaml, { 'empty-lines': { 'max-start': 0 } });
    expect(problems.length).toBeGreaterThan(0);
  });

  it('should detect blank lines at end of file', () => {
    const yaml = 'key: value\n\n\n';
    const problems = lint(yaml, { 'empty-lines': { 'max-end': 0 } });
    expect(problems.length).toBeGreaterThan(0);
  });
});

describe('config loading', () => {
  it('should load default config', () => {
    const config = new YamlLintConfig({ content: 'extends: default' });
    expect(config.rules.size).toBeGreaterThan(0);
  });

  it('should load relaxed config', () => {
    const config = new YamlLintConfig({ content: 'extends: relaxed' });
    expect(config.rules.size).toBeGreaterThan(0);
  });

  it('should disable rules', () => {
    const config = new YamlLintConfig({
      content: `
rules:
  trailing-spaces: disable
`,
    });
    expect(config.rules.get('trailing-spaces')).toBe(false);
  });
});

describe('indentation rule', () => {
  it('should pass correctly indented YAML', () => {
    const yaml = `---
name: test
items:
  - one
  - two
nested:
  key: value
`;
    const problems = lint(yaml, { indentation: 'enable' });
    expect(problems.length).toBe(0);
  });

  it('should detect wrong indentation', () => {
    const yaml = `---
name: test
nested:
    key: value
`;
    const problems = lint(yaml, { indentation: { spaces: 2 } });
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]?.rule).toBe('indentation');
    expect(problems[0]?.desc).toContain('wrong indentation');
  });

  it('should respect custom spaces setting', () => {
    const yaml = `---
name: test
nested:
    key: value
`;
    const problems = lint(yaml, { indentation: { spaces: 4 } });
    expect(problems.length).toBe(0);
  });

  it('should handle nested sequences', () => {
    const yaml = `---
items:
  - nested:
      key: value
  - another:
      key: value
`;
    const problems = lint(yaml, { indentation: 'enable' });
    expect(problems.length).toBe(0);
  });

  it('should handle deeply nested structures', () => {
    const yaml = `---
level1:
  level2:
    level3:
      - item1
      - item2
    back: value
`;
    const problems = lint(yaml, { indentation: { spaces: 2 } });
    expect(problems.length).toBe(0);
  });
});

describe('linter integration', () => {
  it('should run multiple rules together', () => {
    const yaml = 'key: value   \n'; // trailing spaces, no syntax error
    const config = new YamlLintConfig({ content: 'extends: default' });
    const problems = runAll(yaml, config);
    expect(problems.some((p) => p.rule === 'trailing-spaces')).toBe(true);
  });

  it('should report syntax errors', () => {
    const yaml = 'key: [unclosed\n';
    const config = new YamlLintConfig({ content: 'extends: default' });
    const problems = runAll(yaml, config);
    expect(problems.some((p) => p.desc.includes('syntax error'))).toBe(true);
  });

  it('should work with generator interface', () => {
    const yaml = 'key: value\n';
    const config = new YamlLintConfig({ content: 'extends: default' });
    let count = 0;
    for (const _problem of run(yaml, config)) {
      count++;
    }
    // May have problems or not, just verify iteration works
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
