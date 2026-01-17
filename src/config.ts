/**
 * yamllint-ts - TypeScript YAML Linter
 * Configuration parsing and validation
 *
 * Copyright (C) 2024
 * Licensed under GPL-3.0
 */

import { parse as parseYaml } from 'yaml';
import ignoreFactory from 'ignore';
import type { Ignore } from 'ignore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { autoDecode, linesInFilesSync } from './decoder.js';
import type {
  Rule,
  RuleConfig,
  RawConfig,
  RawRuleConfig,
  IgnorePattern,
  ProblemLevel,
} from './types.js';

// =============================================================================
// Error Class
// =============================================================================

export class YamlLintConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YamlLintConfigError';
  }
}

// =============================================================================
// Ignore Pattern Wrapper
// =============================================================================

/**
 * Wraps the 'ignore' library to match our IgnorePattern interface.
 */
class IgnorePatternImpl implements IgnorePattern {
  private ig: Ignore;

  constructor(patterns: string[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.ig = (ignoreFactory as any)().add(patterns);
  }

  ignores(filepath: string): boolean {
    // Normalize path separators and make relative
    const normalized = filepath.replace(/\\/g, '/');
    return this.ig.ignores(normalized);
  }

  static fromLines(lines: string[]): IgnorePatternImpl {
    return new IgnorePatternImpl(lines.filter((line) => line.trim() !== ''));
  }
}

// =============================================================================
// Rule Registry (will be populated by rules module)
// =============================================================================

let ruleRegistry: Map<string, Rule> = new Map();

/**
 * Set the rule registry. Called by the rules module during initialization.
 */
export function setRuleRegistry(rules: Map<string, Rule>): void {
  ruleRegistry = rules;
}

/**
 * Get a rule by ID.
 */
export function getRule(id: string): Rule {
  const rule = ruleRegistry.get(id);
  if (!rule) {
    throw new YamlLintConfigError(`no such rule: "${id}"`);
  }
  return rule;
}

/**
 * Get all rule IDs.
 */
export function getAllRuleIds(): string[] {
  return Array.from(ruleRegistry.keys());
}

// =============================================================================
// Config File Discovery
// =============================================================================

const CONFIG_FILENAMES = ['.yamllint', '.yamllint.yaml', '.yamllint.yml'];

/**
 * Find the configuration file by searching up the directory tree.
 */
export function findConfigFile(startDir: string = process.cwd()): string | null {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  const home = process.env['HOME'] || process.env['USERPROFILE'] || '';

  while (dir !== root) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = path.join(dir, filename);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    // Stop at home directory
    if (dir === home) {
      break;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  // Check XDG config or ~/.config/yamllint/config
  const xdgConfig = process.env['XDG_CONFIG_HOME'] || path.join(home, '.config');
  const userConfig = path.join(xdgConfig, 'yamllint', 'config');
  if (fs.existsSync(userConfig)) {
    return userConfig;
  }

  return null;
}

/**
 * Get the path to an extended config file (built-in or custom).
 */
export function getExtendedConfigFile(name: string): string {
  // Check if it's a built-in config (no path separator)
  if (!name.includes('/') && !name.includes('\\')) {
    // Get the directory of this module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const stdConf = path.join(__dirname, 'conf', `${name}.yaml`);

    if (fs.existsSync(stdConf)) {
      return stdConf;
    }
  }

  // Otherwise, treat it as a file path
  return name;
}

// =============================================================================
// Rule Configuration Validation
// =============================================================================

/**
 * Validate and normalize rule configuration.
 */
export function validateRuleConf(rule: Rule, conf: RawRuleConfig): RuleConfig | false {
  // Handle disable
  if (conf === false || conf === 'disable') {
    return false;
  }

  // Handle enable (use defaults)
  if (conf === true || conf === 'enable') {
    conf = {};
  }

  if (typeof conf !== 'object' || conf === null) {
    throw new YamlLintConfigError(
      `invalid config: rule "${rule.ID}": should be either "enable", "disable" or a mapping`
    );
  }

  const result: RuleConfig = { level: 'error' };

  // Handle ignore-from-file
  if ('ignore-from-file' in conf) {
    let ignoreFiles = conf['ignore-from-file'];
    if (typeof ignoreFiles === 'string') {
      ignoreFiles = [ignoreFiles];
    }
    if (!Array.isArray(ignoreFiles) || !ignoreFiles.every((f) => typeof f === 'string')) {
      throw new YamlLintConfigError(
        'invalid config: ignore-from-file should contain valid filename(s), either as a list or string'
      );
    }
    result.ignore = IgnorePatternImpl.fromLines(linesInFilesSync(ignoreFiles as string[]));
  }
  // Handle ignore
  else if ('ignore' in conf) {
    const ignorePatterns = conf['ignore'];
    if (typeof ignorePatterns === 'string') {
      result.ignore = IgnorePatternImpl.fromLines(ignorePatterns.split('\n'));
    } else if (
      Array.isArray(ignorePatterns) &&
      ignorePatterns.every((p) => typeof p === 'string')
    ) {
      result.ignore = IgnorePatternImpl.fromLines(ignorePatterns as string[]);
    } else {
      throw new YamlLintConfigError('invalid config: ignore should contain file patterns');
    }
  }

  // Handle level
  if ('level' in conf) {
    if (conf['level'] !== 'error' && conf['level'] !== 'warning') {
      throw new YamlLintConfigError('invalid config: level should be "error" or "warning"');
    }
    result.level = conf['level'] as ProblemLevel;
  }

  // Validate rule-specific options
  const ruleOptions = rule.CONF || {};
  const ruleDefaults = rule.DEFAULT || {};

  for (const [optKey, optValue] of Object.entries(conf)) {
    if (optKey === 'ignore' || optKey === 'ignore-from-file' || optKey === 'level') {
      continue;
    }

    if (!(optKey in ruleOptions)) {
      throw new YamlLintConfigError(
        `invalid config: unknown option "${optKey}" for rule "${rule.ID}"`
      );
    }

    const optSpec = ruleOptions[optKey];

    // Validate based on option specification type
    if (Array.isArray(optSpec)) {
      // In Python yamllint:
      // - If CONF[option] is a list, the config value must be a LIST of values from that list
      // - If CONF[option] is a tuple, the config value is a SINGLE value from the tuple
      //
      // Since we use arrays for both in TypeScript, we need to check:
      // - If the config value is an array, validate each element against the spec
      // - If the config value is a single value, check if it's in the spec (enum-style)

      if (Array.isArray(optValue)) {
        // List-type option: validate each element
        const allowedValues = optSpec.filter(
          (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );
        const allowedTypes = optSpec.filter((v) => v === Boolean || v === Number || v === String);

        for (const item of optValue) {
          const isValidLiteral = allowedValues.includes(item as string | number | boolean);
          const isValidType = allowedTypes.some((t) => {
            if (t === Boolean) return typeof item === 'boolean';
            if (t === Number) return typeof item === 'number';
            if (t === String) return typeof item === 'string';
            return false;
          });

          if (!isValidLiteral && !isValidType) {
            throw new YamlLintConfigError(
              `invalid config: option "${optKey}" of "${rule.ID}" should only contain values in ${JSON.stringify(optSpec)}`
            );
          }
        }
      } else {
        // Single value - must match one of the spec values or types (enum-style)
        const validValues = optSpec.filter(
          (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
        );
        const validTypes = optSpec.filter((v) => v === Boolean || v === Number || v === String);

        const isValidLiteral = validValues.includes(optValue as string | number | boolean);
        const isValidType = validTypes.some((t) => {
          if (t === Boolean) return typeof optValue === 'boolean';
          if (t === Number) return typeof optValue === 'number';
          if (t === String) return typeof optValue === 'string';
          return false;
        });

        if (!isValidLiteral && !isValidType) {
          throw new YamlLintConfigError(
            `invalid config: option "${optKey}" of "${rule.ID}" should be in ${JSON.stringify(optSpec)}`
          );
        }
      }
    } else if (optSpec === Boolean) {
      if (typeof optValue !== 'boolean') {
        throw new YamlLintConfigError(
          `invalid config: option "${optKey}" of "${rule.ID}" should be boolean`
        );
      }
    } else if (optSpec === Number) {
      if (typeof optValue !== 'number') {
        throw new YamlLintConfigError(
          `invalid config: option "${optKey}" of "${rule.ID}" should be number`
        );
      }
    } else if (optSpec === String) {
      if (typeof optValue !== 'string') {
        throw new YamlLintConfigError(
          `invalid config: option "${optKey}" of "${rule.ID}" should be string`
        );
      }
    }

    result[optKey] = optValue;
  }

  // Apply defaults for missing options
  for (const [optKey, defaultValue] of Object.entries(ruleDefaults)) {
    if (!(optKey in result)) {
      result[optKey] = defaultValue;
    }
  }

  // Run custom validation if defined
  if (rule.VALIDATE) {
    const validationError = rule.VALIDATE(result);
    if (validationError) {
      throw new YamlLintConfigError(`invalid config: ${rule.ID}: ${validationError}`);
    }
  }

  return result;
}

// =============================================================================
// YamlLintConfig Class
// =============================================================================

export class YamlLintConfig {
  rules: Map<string, RuleConfig | false> = new Map();
  ignore: IgnorePattern | null = null;
  yamlFiles!: IgnorePattern;
  locale: string | null = null;

  constructor(content: string);
  constructor(options: { content?: string; file?: string });
  constructor(arg: string | { content?: string; file?: string }) {
    // Handle string argument as content
    if (typeof arg === 'string') {
      this.parse(arg);
    } else {
      const { content, file } = arg;

      if ((content === undefined) === (file === undefined)) {
        if (content === undefined && file === undefined) {
          // Use default config
          this.parse('extends: default');
        } else {
          throw new YamlLintConfigError('YamlLintConfig requires either content or file, not both');
        }
      } else if (file !== undefined) {
        const buffer = fs.readFileSync(file);
        const decoded = autoDecode(buffer);
        this.parse(decoded);
      } else {
        this.parse(content!);
      }
    }

    // Set default yaml-files pattern only if not already set during parse
    if (!this.yamlFiles) {
      this.yamlFiles = IgnorePatternImpl.fromLines(['*.yaml', '*.yml', '.yamllint']);
    }

    this.validate();
  }

  /**
   * Create a YamlLintConfig from a file path.
   */
  static fromFile(filepath: string): YamlLintConfig {
    return new YamlLintConfig({ file: filepath });
  }

  /**
   * Check if a file should be ignored globally.
   */
  isFileIgnored(filepath: string): boolean {
    return this.ignore !== null && this.ignore.ignores(filepath);
  }

  /**
   * Check if a file is a YAML file based on yaml-files patterns.
   */
  isYamlFile(filepath: string): boolean {
    const basename = path.basename(filepath);
    return this.yamlFiles.ignores(basename);
  }

  /**
   * Get all enabled rules for a given file.
   */
  enabledRules(filepath: string | null): Rule[] {
    const result: Rule[] = [];

    for (const [id, conf] of this.rules) {
      if (conf === false) continue;

      // Check per-rule ignore
      if (filepath !== null && conf.ignore && conf.ignore.ignores(filepath)) {
        continue;
      }

      result.push(getRule(id));
    }

    return result;
  }

  /**
   * Extend this config with a base config.
   */
  private extend(baseConfig: YamlLintConfig): void {
    // Merge rules
    for (const [ruleId, conf] of this.rules) {
      if (typeof conf === 'object' && conf !== null) {
        const baseConf = baseConfig.rules.get(ruleId);
        if (baseConf && typeof baseConf === 'object') {
          // Merge rule configs
          baseConfig.rules.set(ruleId, { ...baseConf, ...conf });
        } else {
          baseConfig.rules.set(ruleId, conf);
        }
      } else {
        baseConfig.rules.set(ruleId, conf);
      }
    }

    this.rules = baseConfig.rules;

    // Inherit ignore if not set
    if (baseConfig.ignore !== null && this.ignore === null) {
      this.ignore = baseConfig.ignore;
    }
  }

  /**
   * Parse raw YAML configuration.
   */
  private parse(rawContent: string): void {
    let conf: RawConfig;
    try {
      conf = parseYaml(rawContent) as RawConfig;
    } catch (e) {
      throw new YamlLintConfigError(`invalid config: ${e}`);
    }

    if (typeof conf !== 'object' || conf === null || Array.isArray(conf)) {
      throw new YamlLintConfigError('invalid config: not a mapping');
    }

    // Parse rules
    const rawRules = conf.rules || {};
    if (typeof rawRules !== 'object') {
      throw new YamlLintConfigError('invalid config: rules should be a mapping');
    }

    for (const [ruleId, ruleConf] of Object.entries(rawRules)) {
      if (ruleConf === 'enable') {
        this.rules.set(ruleId, { level: 'error' });
      } else if (ruleConf === 'disable') {
        this.rules.set(ruleId, false);
      } else {
        this.rules.set(ruleId, ruleConf as RuleConfig | false);
      }
    }

    // Handle extends
    if (conf.extends) {
      const extendPath = getExtendedConfigFile(conf.extends);
      const baseConfig = new YamlLintConfig({ file: extendPath });
      this.extend(baseConfig);
    }

    // Handle ignore and ignore-from-file
    if (conf.ignore && conf['ignore-from-file']) {
      throw new YamlLintConfigError(
        'invalid config: ignore and ignore-from-file keys cannot be used together'
      );
    }

    if (conf['ignore-from-file']) {
      let ignoreFiles = conf['ignore-from-file'];
      if (typeof ignoreFiles === 'string') {
        ignoreFiles = [ignoreFiles];
      }
      if (!Array.isArray(ignoreFiles) || !ignoreFiles.every((f) => typeof f === 'string')) {
        throw new YamlLintConfigError(
          'invalid config: ignore-from-file should contain filename(s), either as a list or string'
        );
      }
      this.ignore = IgnorePatternImpl.fromLines(linesInFilesSync(ignoreFiles));
    } else if (conf.ignore) {
      if (typeof conf.ignore === 'string') {
        this.ignore = IgnorePatternImpl.fromLines(conf.ignore.split('\n'));
      } else if (Array.isArray(conf.ignore) && conf.ignore.every((p) => typeof p === 'string')) {
        this.ignore = IgnorePatternImpl.fromLines(conf.ignore);
      } else {
        throw new YamlLintConfigError('invalid config: ignore should contain file patterns');
      }
    }

    // Handle yaml-files
    if (conf['yaml-files']) {
      if (
        !Array.isArray(conf['yaml-files']) ||
        !conf['yaml-files'].every((p) => typeof p === 'string')
      ) {
        throw new YamlLintConfigError(
          'invalid config: yaml-files should be a list of file patterns'
        );
      }
      this.yamlFiles = IgnorePatternImpl.fromLines(conf['yaml-files']);
    }

    // Handle locale
    if (conf.locale) {
      if (typeof conf.locale !== 'string') {
        throw new YamlLintConfigError('invalid config: locale should be a string');
      }
      this.locale = conf.locale;
    }
  }

  /**
   * Validate all rule configurations.
   */
  private validate(): void {
    for (const [id, conf] of this.rules) {
      try {
        const rule = getRule(id);
        const validated = validateRuleConf(rule, conf as RawRuleConfig);
        this.rules.set(id, validated);
      } catch (e) {
        if (e instanceof YamlLintConfigError) {
          throw e;
        }
        throw new YamlLintConfigError(`invalid config: ${e}`);
      }
    }
  }
}
