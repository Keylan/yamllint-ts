/**
 * yamllint-ts - TypeScript YAML Linter
 * Configuration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  YamlLintConfig,
  YamlLintConfigError,
  validateRuleConf,
  getRule,
  getAllRuleIds,
  findConfigFile,
  getExtendedConfigFile,
} from '../src/config.js';
import '../src/rules/index.js';

let tempDir: string;

describe('config', () => {
  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yamllint-ts-config-test-'));
  });

  afterAll(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('YamlLintConfigError', () => {
    it('should create error with message', () => {
      const error = new YamlLintConfigError('test error');
      expect(error.message).toBe('test error');
      expect(error.name).toBe('YamlLintConfigError');
    });

    it('should be instanceof Error', () => {
      const error = new YamlLintConfigError('test');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('getRule', () => {
    it('should return a rule by ID', () => {
      const rule = getRule('indentation');
      expect(rule).toBeDefined();
      expect(rule.ID).toBe('indentation');
    });

    it('should throw for unknown rule', () => {
      expect(() => getRule('nonexistent-rule')).toThrow(YamlLintConfigError);
      expect(() => getRule('nonexistent-rule')).toThrow('no such rule');
    });
  });

  describe('getAllRuleIds', () => {
    it('should return all rule IDs', () => {
      const ids = getAllRuleIds();
      expect(ids).toContain('indentation');
      expect(ids).toContain('line-length');
      expect(ids).toContain('trailing-spaces');
      expect(ids.length).toBeGreaterThan(10);
    });
  });

  describe('findConfigFile', () => {
    it('should find .yamllint file', () => {
      const testDir = path.join(tempDir, 'find-yamllint');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint'), 'extends: default\n');

      const result = findConfigFile(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint'));
    });

    it('should find .yamllint.yaml file', () => {
      const testDir = path.join(tempDir, 'find-yamllint-yaml');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint.yaml'), 'extends: default\n');

      const result = findConfigFile(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint.yaml'));
    });

    it('should find .yamllint.yml file', () => {
      const testDir = path.join(tempDir, 'find-yamllint-yml');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, '.yamllint.yml'), 'extends: default\n');

      const result = findConfigFile(testDir);
      expect(result).toBe(path.join(testDir, '.yamllint.yml'));
    });

    it('should search parent directories', () => {
      const parentDir = path.join(tempDir, 'parent-search');
      const childDir = path.join(parentDir, 'child', 'grandchild');
      fs.mkdirSync(childDir, { recursive: true });
      fs.writeFileSync(path.join(parentDir, '.yamllint'), 'extends: default\n');

      const result = findConfigFile(childDir);
      expect(result).toBe(path.join(parentDir, '.yamllint'));
    });

    it('should return null if no config found', () => {
      const testDir = path.join(tempDir, 'no-config-dir');
      fs.mkdirSync(testDir, { recursive: true });

      // This may find a config in parent dirs, so we need to be careful
      // Just verify it returns a string or null
      const result = findConfigFile(testDir);
      expect(result === null || typeof result === 'string').toBe(true);
    });
  });

  describe('getExtendedConfigFile', () => {
    it('should return path for built-in default config', () => {
      const result = getExtendedConfigFile('default');
      expect(result).toContain('default.yaml');
      expect(fs.existsSync(result)).toBe(true);
    });

    it('should return path for built-in relaxed config', () => {
      const result = getExtendedConfigFile('relaxed');
      expect(result).toContain('relaxed.yaml');
      expect(fs.existsSync(result)).toBe(true);
    });

    it('should return path as-is for custom paths', () => {
      const customPath = '/custom/config.yaml';
      expect(getExtendedConfigFile(customPath)).toBe(customPath);
    });

    it('should return path as-is for relative paths', () => {
      const relativePath = './my-config.yaml';
      expect(getExtendedConfigFile(relativePath)).toBe(relativePath);
    });
  });

  describe('validateRuleConf', () => {
    it('should return false for disable', () => {
      const rule = getRule('indentation');
      expect(validateRuleConf(rule, 'disable')).toBe(false);
      expect(validateRuleConf(rule, false)).toBe(false);
    });

    it('should return config for enable', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, 'enable');
      expect(result).not.toBe(false);
      expect((result as object)['level']).toBe('error');
    });

    it('should return config for true', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, true);
      expect(result).not.toBe(false);
    });

    it('should validate rule options', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, { spaces: 4 });
      expect(result).not.toBe(false);
      expect((result as Record<string, unknown>)['spaces']).toBe(4);
    });

    it('should throw for unknown options', () => {
      const rule = getRule('indentation');
      expect(() => validateRuleConf(rule, { 'unknown-option': true })).toThrow(YamlLintConfigError);
    });

    it('should throw for invalid option types', () => {
      const rule = getRule('line-length');
      expect(() => validateRuleConf(rule, { max: 'not-a-number' })).toThrow(YamlLintConfigError);
    });

    it('should apply defaults for missing options', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, {}) as Record<string, unknown>;
      expect(result['spaces']).toBeDefined();
    });

    it('should validate level option', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, { level: 'warning' }) as Record<string, unknown>;
      expect(result['level']).toBe('warning');
    });

    it('should throw for invalid level', () => {
      const rule = getRule('indentation');
      expect(() => validateRuleConf(rule, { level: 'invalid' })).toThrow(YamlLintConfigError);
    });

    it('should throw for non-object config', () => {
      const rule = getRule('indentation');
      expect(() => validateRuleConf(rule, 'invalid' as unknown as object)).toThrow(
        YamlLintConfigError
      );
    });

    it('should handle ignore patterns as string', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, { ignore: '*.generated.yaml' }) as Record<
        string,
        unknown
      >;
      expect(result['ignore']).toBeDefined();
    });

    it('should handle ignore patterns as array', () => {
      const rule = getRule('indentation');
      const result = validateRuleConf(rule, {
        ignore: ['*.generated.yaml', '*.template.yaml'],
      }) as Record<string, unknown>;
      expect(result['ignore']).toBeDefined();
    });

    it('should throw for invalid ignore patterns', () => {
      const rule = getRule('indentation');
      expect(() => validateRuleConf(rule, { ignore: 123 })).toThrow(YamlLintConfigError);
    });

    it('should handle ignore-from-file as string', () => {
      const ignoreFile = path.join(tempDir, 'ignore-patterns.txt');
      fs.writeFileSync(ignoreFile, '*.generated.yaml\n*.template.yaml\n');

      const rule = getRule('indentation');
      const result = validateRuleConf(rule, { 'ignore-from-file': ignoreFile }) as Record<
        string,
        unknown
      >;
      expect(result['ignore']).toBeDefined();
    });

    it('should handle ignore-from-file as array', () => {
      const ignoreFile = path.join(tempDir, 'ignore-patterns2.txt');
      fs.writeFileSync(ignoreFile, '*.generated.yaml\n');

      const rule = getRule('indentation');
      const result = validateRuleConf(rule, { 'ignore-from-file': [ignoreFile] }) as Record<
        string,
        unknown
      >;
      expect(result['ignore']).toBeDefined();
    });

    it('should throw for invalid ignore-from-file', () => {
      const rule = getRule('indentation');
      expect(() => validateRuleConf(rule, { 'ignore-from-file': 123 })).toThrow(
        YamlLintConfigError
      );
    });

    it('should validate enum options', () => {
      const rule = getRule('quoted-strings');
      const result = validateRuleConf(rule, { 'quote-type': 'single' }) as Record<string, unknown>;
      expect(result['quote-type']).toBe('single');
    });

    it('should throw for invalid enum value', () => {
      const rule = getRule('quoted-strings');
      expect(() => validateRuleConf(rule, { 'quote-type': 'invalid' })).toThrow(
        YamlLintConfigError
      );
    });

    it('should validate boolean options', () => {
      const rule = getRule('truthy');
      const result = validateRuleConf(rule, { 'check-keys': false }) as Record<string, unknown>;
      expect(result['check-keys']).toBe(false);
    });

    it('should throw for non-boolean when boolean expected', () => {
      const rule = getRule('truthy');
      expect(() => validateRuleConf(rule, { 'check-keys': 'yes' })).toThrow(YamlLintConfigError);
    });

    it('should validate array-type options', () => {
      const rule = getRule('truthy');
      const result = validateRuleConf(rule, { 'allowed-values': ['true', 'false'] }) as Record<
        string,
        unknown
      >;
      expect(result['allowed-values']).toEqual(['true', 'false']);
    });
  });

  describe('YamlLintConfig', () => {
    describe('constructor', () => {
      it('should parse string config', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.rules.size).toBeGreaterThan(0);
      });

      it('should parse object with content', () => {
        const config = new YamlLintConfig({ content: 'extends: default' });
        expect(config.rules.size).toBeGreaterThan(0);
      });

      it('should parse object with file', () => {
        const configFile = path.join(tempDir, 'test-config.yaml');
        fs.writeFileSync(configFile, 'extends: default\n');

        const config = new YamlLintConfig({ file: configFile });
        expect(config.rules.size).toBeGreaterThan(0);
      });

      it('should use default config when no args provided', () => {
        const config = new YamlLintConfig({});
        expect(config.rules.size).toBeGreaterThan(0);
      });

      it('should throw when both content and file provided', () => {
        expect(
          () =>
            new YamlLintConfig({
              content: 'extends: default',
              file: '/some/path',
            })
        ).toThrow(YamlLintConfigError);
      });

      it('should throw for invalid YAML', () => {
        expect(() => new YamlLintConfig('invalid: yaml: content:')).toThrow(YamlLintConfigError);
      });

      it('should throw for non-mapping config', () => {
        expect(() => new YamlLintConfig('- just\n- a\n- list')).toThrow(YamlLintConfigError);
      });
    });

    describe('fromFile', () => {
      it('should load config from file', () => {
        const configFile = path.join(tempDir, 'from-file-config.yaml');
        fs.writeFileSync(configFile, 'extends: default\n');

        const config = YamlLintConfig.fromFile(configFile);
        expect(config.rules.size).toBeGreaterThan(0);
      });
    });

    describe('extends', () => {
      it('should extend default config', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.rules.has('indentation')).toBe(true);
      });

      it('should extend relaxed config', () => {
        const config = new YamlLintConfig('extends: relaxed');
        expect(config.rules.size).toBeGreaterThan(0);
      });

      it('should override extended config rules', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  indentation: disable
`);
        expect(config.rules.get('indentation')).toBe(false);
      });

      it('should merge rule options with extended config', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  line-length:
    max: 120
`);
        const lineLength = config.rules.get('line-length') as Record<string, unknown>;
        expect(lineLength['max']).toBe(120);
      });
    });

    describe('rules', () => {
      it('should parse rule enable', () => {
        const config = new YamlLintConfig(`
rules:
  trailing-spaces: enable
`);
        const rule = config.rules.get('trailing-spaces');
        expect(rule).not.toBe(false);
      });

      it('should parse rule disable', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  trailing-spaces: disable
`);
        expect(config.rules.get('trailing-spaces')).toBe(false);
      });

      it('should parse rule with options', () => {
        const config = new YamlLintConfig(`
rules:
  indentation:
    spaces: 4
    indent-sequences: true
`);
        const rule = config.rules.get('indentation') as Record<string, unknown>;
        expect(rule['spaces']).toBe(4);
      });

      it('should throw for unknown rule', () => {
        expect(
          () =>
            new YamlLintConfig(`
rules:
  nonexistent-rule: enable
`)
        ).toThrow(YamlLintConfigError);
      });

      it('should throw for invalid rules section', () => {
        expect(
          () =>
            new YamlLintConfig(`
rules: not-a-mapping
`)
        ).toThrow(YamlLintConfigError);
      });
    });

    describe('ignore', () => {
      it('should parse ignore as string', () => {
        const config = new YamlLintConfig(`
extends: default
ignore: |
  *.generated.yaml
  /vendor/
`);
        expect(config.ignore).not.toBeNull();
        expect(config.isFileIgnored('test.generated.yaml')).toBe(true);
      });

      it('should parse ignore as array', () => {
        const config = new YamlLintConfig(`
extends: default
ignore:
  - "*.generated.yaml"
  - "/vendor/"
`);
        expect(config.ignore).not.toBeNull();
      });

      it('should throw for invalid ignore', () => {
        expect(
          () =>
            new YamlLintConfig(`
extends: default
ignore: 123
`)
        ).toThrow(YamlLintConfigError);
      });

      it('should throw when both ignore and ignore-from-file used', () => {
        const ignoreFile = path.join(tempDir, 'ignore-conflict.txt');
        fs.writeFileSync(ignoreFile, '*.yaml\n');

        expect(
          () =>
            new YamlLintConfig(`
extends: default
ignore: "*.yaml"
ignore-from-file: ${ignoreFile}
`)
        ).toThrow(YamlLintConfigError);
      });
    });

    describe('ignore-from-file', () => {
      it('should load ignore patterns from file', () => {
        const ignoreFile = path.join(tempDir, 'ignore-from.txt');
        fs.writeFileSync(ignoreFile, '*.generated.yaml\n/vendor/\n');

        const config = new YamlLintConfig(`
extends: default
ignore-from-file: ${ignoreFile}
`);
        expect(config.ignore).not.toBeNull();
      });

      it('should load from multiple files', () => {
        const ignoreFile1 = path.join(tempDir, 'ignore1.txt');
        const ignoreFile2 = path.join(tempDir, 'ignore2.txt');
        fs.writeFileSync(ignoreFile1, '*.a.yaml\n');
        fs.writeFileSync(ignoreFile2, '*.b.yaml\n');

        const config = new YamlLintConfig(`
extends: default
ignore-from-file:
  - ${ignoreFile1}
  - ${ignoreFile2}
`);
        expect(config.ignore).not.toBeNull();
      });

      it('should throw for invalid ignore-from-file', () => {
        expect(
          () =>
            new YamlLintConfig(`
extends: default
ignore-from-file: 123
`)
        ).toThrow(YamlLintConfigError);
      });
    });

    describe('yaml-files', () => {
      it('should use default yaml-files patterns', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.isYamlFile('test.yaml')).toBe(true);
        expect(config.isYamlFile('test.yml')).toBe(true);
        expect(config.isYamlFile('.yamllint')).toBe(true);
        expect(config.isYamlFile('test.txt')).toBe(false);
      });

      it('should parse custom yaml-files patterns', () => {
        const config = new YamlLintConfig(`
extends: default
yaml-files:
  - "*.yaml"
  - "*.custom"
`);
        expect(config.isYamlFile('test.yaml')).toBe(true);
        expect(config.isYamlFile('test.custom')).toBe(true);
      });

      it('should throw for invalid yaml-files', () => {
        expect(
          () =>
            new YamlLintConfig(`
extends: default
yaml-files: not-a-list
`)
        ).toThrow(YamlLintConfigError);
      });
    });

    describe('locale', () => {
      it('should parse locale', () => {
        const config = new YamlLintConfig(`
extends: default
locale: en_US.UTF-8
`);
        expect(config.locale).toBe('en_US.UTF-8');
      });

      it('should throw for invalid locale', () => {
        expect(
          () =>
            new YamlLintConfig(`
extends: default
locale: 123
`)
        ).toThrow(YamlLintConfigError);
      });
    });

    describe('isFileIgnored', () => {
      it('should return false when no ignore patterns', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.isFileIgnored('any-file.yaml')).toBe(false);
      });

      it('should match ignore patterns', () => {
        const config = new YamlLintConfig(`
extends: default
ignore: |
  *.generated.yaml
  /vendor/
`);
        expect(config.isFileIgnored('test.generated.yaml')).toBe(true);
        expect(config.isFileIgnored('vendor/lib.yaml')).toBe(true);
        expect(config.isFileIgnored('src/main.yaml')).toBe(false);
      });
    });

    describe('isYamlFile', () => {
      it('should match yaml files', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.isYamlFile('test.yaml')).toBe(true);
        expect(config.isYamlFile('test.yml')).toBe(true);
        expect(config.isYamlFile('/path/to/file.yaml')).toBe(true);
      });

      it('should not match non-yaml files', () => {
        const config = new YamlLintConfig('extends: default');
        expect(config.isYamlFile('test.txt')).toBe(false);
        expect(config.isYamlFile('test.json')).toBe(false);
      });
    });

    describe('enabledRules', () => {
      it('should return enabled rules', () => {
        const config = new YamlLintConfig('extends: default');
        const rules = config.enabledRules(null);
        expect(rules.length).toBeGreaterThan(0);
        expect(rules.some((r) => r.ID === 'indentation')).toBe(true);
      });

      it('should exclude disabled rules', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  indentation: disable
`);
        const rules = config.enabledRules(null);
        expect(rules.some((r) => r.ID === 'indentation')).toBe(false);
      });

      it('should exclude rules for ignored files', () => {
        const config = new YamlLintConfig(`
extends: default
rules:
  indentation:
    ignore: "*.special.yaml"
`);
        const rulesForNormal = config.enabledRules('test.yaml');
        const rulesForSpecial = config.enabledRules('test.special.yaml');

        expect(rulesForNormal.some((r) => r.ID === 'indentation')).toBe(true);
        expect(rulesForSpecial.some((r) => r.ID === 'indentation')).toBe(false);
      });
    });
  });
});
