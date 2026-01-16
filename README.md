# yamllint-ts

A TypeScript implementation of [yamllint](https://github.com/adrienverge/yamllint), the YAML linter.

## Installation

```bash
npm install yamllint-ts
```

## Usage

```bash
# Lint a file
yamllint-ts myfile.yaml

# Lint with a config file
yamllint-ts -c .yamllint.yaml myfile.yaml

# Lint with inline config
yamllint-ts -d '{extends: relaxed, rules: {line-length: {max: 120}}}' myfile.yaml
```

## Configuration

yamllint-ts uses the same configuration format as Python yamllint. See the [yamllint documentation](https://yamllint.readthedocs.io/en/stable/configuration.html) for details.

## Compatibility with Python yamllint

yamllint-ts aims for full feature parity with Python yamllint. All linting rules are implemented and produce identical results for valid YAML files.

### Parser Differences

yamllint-ts uses the [yaml](https://github.com/eemeli/yaml) package for YAML parsing, while Python yamllint uses [PyYAML](https://pyyaml.org/). These parsers have different error reporting behavior for **malformed YAML**:

| Aspect | Python yamllint (PyYAML) | yamllint-ts (eemeli/yaml) |
|--------|--------------------------|---------------------------|
| Error messages | PyYAML-style messages (e.g., "could not find expected ':'") | yaml-style messages (e.g., "Implicit keys need to be on a single line") |
| Error positions | May differ by 1-2 lines | May differ by 1-2 lines |
| Error detection | Detects some errors earlier/later in parsing | Detects some errors earlier/later in parsing |

#### Example

For this YAML with `no_space_after:value` on line 3 (missing space after colon):

```yaml
---
good: value
no_space_after:value
extra_spaces:   value
```

- **Python yamllint**: `4:1 error syntax error: could not find expected ':'`
- **yamllint-ts**: `3:1 error syntax error: Implicit keys need to be on a single line`

Both correctly identify the file as invalid, but with different error messages and line numbers.

#### Impact

- **For valid YAML**: 100% parity - all rules produce identical results
- **For malformed YAML**: Syntax errors are detected but may have different messages/positions
- **Comparison testing**: 144/160 tests match (90%), with all differences being syntax error reporting

### Why Not Use PyYAML?

Porting PyYAML's scanner (~2000 lines of Python) to TypeScript would be a significant undertaking. The current approach provides full linting functionality while leveraging a well-maintained, modern YAML parser. The trade-off of slightly different syntax error messages for invalid YAML was deemed acceptable.

## Rules

All yamllint rules are supported:

- `anchors`
- `braces`
- `brackets`
- `colons`
- `commas`
- `comments`
- `comments-indentation`
- `document-end`
- `document-start`
- `empty-lines`
- `empty-values`
- `float-values`
- `hyphens`
- `indentation`
- `key-duplicates`
- `key-ordering`
- `line-length`
- `new-line-at-end-of-file`
- `new-lines`
- `octal-values`
- `quoted-strings`
- `trailing-spaces`
- `truthy`

## License

GPL-3.0 (same as Python yamllint)

## Attribution

This project is a TypeScript port of [yamllint](https://github.com/adrienverge/yamllint) by Adrien Vergé, licensed under GPL-3.0. The original Python implementation provided the design, rules, and test cases that this port is based on.
