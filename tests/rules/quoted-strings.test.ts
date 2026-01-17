/**
 * Quoted-strings rule tests - Ported from Python yamllint
 */

import { describe, test } from 'vitest';
import { check } from '../helpers.js';

const RULE_ID = 'quoted-strings';

describe('quoted values', () => {
  test('disabled', () => {
    const conf = 'quoted-strings: disable';
    check('---\n' + 'foo: bar\n', conf, RULE_ID);
    check('---\n' + 'foo: "bar"\n', conf, RULE_ID);
    check('---\n' + "foo: 'bar'\n", conf, RULE_ID);
    check('---\n' + 'bar: 123\n', conf, RULE_ID);
    check('---\n' + 'bar: "123"\n', conf, RULE_ID);
  });

  test('quote type any', () => {
    const conf = 'quoted-strings: {quote-type: any}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [4, 10],
        problem2: [17, 5],
        problem3: [19, 12],
        problem4: [20, 15],
        problem5: [21, 13],
        problem6: [22, 16],
        problem7: [23, 19],
        problem8: [23, 28],
        problem9: [24, 20],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [9, 3] }
    );
  });

  test('quote type single', () => {
    const conf = 'quoted-strings: {quote-type: single}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [4, 10],
        problem2: [5, 10],
        problem3: [6, 10],
        problem4: [7, 10],
        problem5: [17, 5],
        problem6: [18, 5],
        problem7: [19, 12],
        problem8: [19, 17],
        problem9: [20, 15],
        problem10: [20, 23],
        problem11: [21, 13],
        problem12: [21, 18],
        problem13: [21, 29],
        problem14: [21, 41],
        problem15: [22, 16],
        problem16: [22, 24],
        problem17: [23, 19],
        problem18: [23, 28],
        problem19: [23, 33],
        problem20: [24, 20],
        problem21: [24, 30],
        problem22: [24, 45],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [9, 3], problem2: [12, 3], problem3: [15, 3] }
    );
  });

  test('quote type double', () => {
    const conf = 'quoted-strings: {quote-type: double}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [4, 10],
        problem2: [8, 10],
        problem3: [17, 5],
        problem4: [19, 12],
        problem5: [20, 15],
        problem6: [21, 13],
        problem7: [22, 16],
        problem8: [23, 19],
        problem9: [23, 28],
        problem10: [24, 20],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [9, 3] }
    );
  });

  test('any quotes not required', () => {
    const conf = 'quoted-strings: {quote-type: any, required: false}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID
    );
  });

  test('single quotes not required', () => {
    const conf = 'quoted-strings: {quote-type: single, required: false}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [5, 10],
        problem2: [6, 10],
        problem3: [7, 10],
        problem4: [18, 5],
        problem5: [19, 17],
        problem6: [20, 23],
        problem7: [21, 18],
        problem8: [21, 29],
        problem9: [21, 41],
        problem10: [22, 24],
        problem11: [23, 33],
        problem12: [24, 30],
        problem13: [24, 45],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [12, 3], problem2: [15, 3] }
    );
  });

  test('only when needed', () => {
    const conf = 'quoted-strings: {required: only-when-needed}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar", "foo[bar]", "foo{bar}"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [5, 10],
        problem2: [8, 10],
        problem3: [18, 5],
        problem4: [19, 17],
        problem5: [20, 23],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [12, 3] }
    );
  });

  test('only when needed single quotes', () => {
    const conf =
      'quoted-strings: {quote-type: single,\n' + '                 required: only-when-needed}\n';
    check(
      '---\n' +
        'boolean1: true\n' +
        'number1: 123\n' +
        'string1: foo\n' +
        'string2: "foo"\n' +
        'string3: "true"\n' +
        'string4: "123"\n' +
        "string5: 'bar'\n" +
        'string6: !!str genericstring\n' +
        'string7: !!str 456\n' +
        'string8: !!str "quotedgenericstring"\n' +
        'binary: !!binary binstring\n' +
        'integer: !!int intstring\n' +
        'boolean2: !!bool boolstring\n' +
        'boolean3: !!bool "quotedboolstring"\n' +
        'block-seq:\n' +
        '  - foo\n' +
        '  - "foo"\n' +
        'flow-seq: [foo, "foo"]\n' +
        'flow-map: {a: foo, b: "foo"}\n' +
        'flow-seq2: [foo, "foo,bar"]\n' +
        'flow-map2: {a: foo, b: "foo,bar"}\n' +
        'nested-flow1: {a: foo, b: [foo, "foo,bar"]}\n' +
        'nested-flow2: [{a: foo}, {b: "foo,bar", c: ["d[e]"]}]\n',
      conf,
      RULE_ID,
      {
        problem1: [5, 10],
        problem2: [6, 10],
        problem3: [7, 10],
        problem4: [8, 10],
        problem5: [18, 5],
        problem6: [19, 17],
        problem7: [20, 23],
        problem8: [21, 18],
        problem9: [22, 24],
        problem10: [23, 33],
        problem11: [24, 30],
        problem12: [24, 45],
      }
    );
    check(
      '---\n' +
        'multiline string 1: |\n' +
        '  line 1\n' +
        '  line 2\n' +
        'multiline string 2: >\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 3:\n' +
        '  word 1\n' +
        '  word 2\n' +
        'multiline string 4:\n' +
        '  "word 1\n' +
        '   word 2"\n' +
        'multiline string 5:\n' +
        '  "word 1\\\n' +
        '   word 2"\n',
      conf,
      RULE_ID,
      { problem1: [12, 3], problem2: [15, 3] }
    );
  });

  test('only when needed corner cases', () => {
    const conf = 'quoted-strings: {required: only-when-needed}\n';
    check(
      '---\n' +
        '- ""\n' +
        '- "- item"\n' +
        '- "key: value"\n' +
        '- "%H:%M:%S"\n' +
        '- "%wheel ALL=(ALL) NOPASSWD: ALL"\n' +
        '- \'"quoted"\'\n' +
        "- \"'foo' == 'bar'\"\n" +
        '- "\'Mac\' in ansible_facts.product_name"\n' +
        "- 'foo # bar'\n",
      conf,
      RULE_ID
    );
    check(
      '---\n' +
        'k1: ""\n' +
        'k2: "- item"\n' +
        'k3: "key: value"\n' +
        'k4: "%H:%M:%S"\n' +
        'k5: "%wheel ALL=(ALL) NOPASSWD: ALL"\n' +
        'k6: \'"quoted"\'\n' +
        "k7: \"'foo' == 'bar'\"\n" +
        'k8: "\'Mac\' in ansible_facts.product_name"\n',
      conf,
      RULE_ID
    );
    check(
      '---\n' +
        '- ---\n' +
        '- "---"\n' +
        '- ----------\n' +
        '- "----------"\n' +
        '- :wq\n' +
        '- ":wq"\n',
      conf,
      RULE_ID,
      { problem1: [3, 3], problem2: [5, 3], problem3: [7, 3] }
    );
    check(
      '---\n' +
        'k1: ---\n' +
        'k2: "---"\n' +
        'k3: ----------\n' +
        'k4: "----------"\n' +
        'k5: :wq\n' +
        'k6: ":wq"\n',
      conf,
      RULE_ID,
      { problem1: [3, 5], problem2: [5, 5], problem3: [7, 5] }
    );
  });

  test('only when needed extras', () => {
    const conf = 'quoted-strings:\n' + '  required: true\n';
    check(
      '---\n' +
        '- 123\n' +
        '- "123"\n' +
        '- localhost\n' +
        '- "localhost"\n' +
        '- http://localhost\n' +
        '- "http://localhost"\n' +
        '- ftp://localhost\n' +
        '- "ftp://localhost"\n',
      conf,
      RULE_ID,
      { problem1: [4, 3], problem2: [6, 3], problem3: [8, 3] }
    );

    const conf2 =
      'quoted-strings:\n' +
      '  required: only-when-needed\n' +
      '  extra-allowed: [^ftp://]\n' +
      '  extra-required: [^http://]\n';
    check(
      '---\n' +
        '- 123\n' +
        '- "123"\n' +
        '- localhost\n' +
        '- "localhost"\n' +
        '- http://localhost\n' +
        '- "http://localhost"\n' +
        '- ftp://localhost\n' +
        '- "ftp://localhost"\n',
      conf2,
      RULE_ID,
      { problem1: [5, 3], problem2: [6, 3] }
    );

    const conf3 =
      'quoted-strings:\n' + '  required: false\n' + '  extra-required: [^http://, ^ftp://]\n';
    check(
      '---\n' +
        '- 123\n' +
        '- "123"\n' +
        '- localhost\n' +
        '- "localhost"\n' +
        '- http://localhost\n' +
        '- "http://localhost"\n' +
        '- ftp://localhost\n' +
        '- "ftp://localhost"\n',
      conf3,
      RULE_ID,
      { problem1: [6, 3], problem2: [8, 3] }
    );

    const conf4 =
      'quoted-strings:\n' +
      '  required: only-when-needed\n' +
      '  extra-allowed: [^ftp://, ";$", " "]\n';
    check(
      '---\n' +
        '- localhost\n' +
        '- "localhost"\n' +
        '- ftp://localhost\n' +
        '- "ftp://localhost"\n' +
        '- i=i+1\n' +
        '- "i=i+1"\n' +
        '- i=i+2;\n' +
        '- "i=i+2;"\n' +
        '- foo\n' +
        '- "foo"\n' +
        '- foo bar\n' +
        '- "foo bar"\n',
      conf4,
      RULE_ID,
      { problem1: [3, 3], problem2: [7, 3], problem3: [11, 3] }
    );
  });

  test('octal values', () => {
    const conf = 'quoted-strings: {required: true}\n';
    check(
      '---\n' +
        '- 100\n' +
        '- 0100\n' +
        '- 0o100\n' +
        '- 777\n' +
        '- 0777\n' +
        '- 0o777\n' +
        '- 800\n' +
        '- 0800\n' +
        '- 0o800\n' +
        '- "0800"\n' +
        '- "0o800"\n',
      conf,
      RULE_ID,
      { problem1: [9, 3], problem2: [10, 3] }
    );
  });

  test('allow quoted quotes', () => {
    let conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: false,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: false,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: true,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: true,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: only-when-needed,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: single,\n' +
      '                 required: only-when-needed,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + 'foo1: "[barbaz]"\n' + 'foo2: "[bar\'baz]"\n', conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: false,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: false,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: true,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: true,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: only-when-needed,\n' +
      '                 allow-quoted-quotes: false}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
      problem2: [3, 7],
    });

    conf =
      'quoted-strings: {quote-type: double,\n' +
      '                 required: only-when-needed,\n' +
      '                 allow-quoted-quotes: true}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID, {
      problem1: [2, 7],
    });

    conf = 'quoted-strings: {quote-type: any}\n';
    check('---\n' + "foo1: '[barbaz]'\n" + "foo2: '[bar\"baz]'\n", conf, RULE_ID);
  });
});

describe('quoted keys', () => {
  test('disabled', () => {
    const confDisabled = 'quoted-strings: {}\n' + 'key-duplicates: disable\n';
    const keyStrings =
      '---\n' +
      'true: 2\n' +
      '123: 3\n' +
      'foo1: 4\n' +
      '"foo2": 5\n' +
      '"false": 6\n' +
      '"234": 7\n' +
      "'bar': 8\n" +
      '!!str generic_string: 9\n' +
      '!!str 456: 10\n' +
      '!!str "quoted_generic_string": 11\n' +
      '!!binary binstring: 12\n' +
      '!!int int_string: 13\n' +
      '!!bool bool_string: 14\n' +
      '!!bool "quoted_bool_string": 15\n' +
      '? - 16\n' +
      '  - 17\n' +
      ': 18\n' +
      '[119, 219]: 19\n' +
      '? a: 20\n' +
      '  "b": 21\n' +
      ': 22\n' +
      '{a: 123, "b": 223}: 23\n' +
      '? |\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 27\n' +
      '? >\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 31\n' +
      '?\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 35\n' +
      '?\n' +
      '  "line 1\n' +
      '  line 2"\n' +
      ': 37\n' +
      '?\n' +
      '  "line 1\\\n' +
      '   line 2"\n' +
      ': 39\n';
    check(keyStrings, confDisabled, RULE_ID);
  });

  test('default', () => {
    const confDefault = 'quoted-strings:\n' + '  check-keys: true\n' + 'key-duplicates: disable\n';
    const keyStrings =
      '---\n' +
      'true: 2\n' +
      '123: 3\n' +
      'foo1: 4\n' +
      '"foo2": 5\n' +
      '"false": 6\n' +
      '"234": 7\n' +
      "'bar': 8\n" +
      '!!str generic_string: 9\n' +
      '!!str 456: 10\n' +
      '!!str "quoted_generic_string": 11\n' +
      '!!binary binstring: 12\n' +
      '!!int int_string: 13\n' +
      '!!bool bool_string: 14\n' +
      '!!bool "quoted_bool_string": 15\n' +
      '? - 16\n' +
      '  - 17\n' +
      ': 18\n' +
      '[119, 219]: 19\n' +
      '? a: 20\n' +
      '  "b": 21\n' +
      ': 22\n' +
      '{a: 123, "b": 223}: 23\n' +
      '? |\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 27\n' +
      '? >\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 31\n' +
      '?\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 35\n' +
      '?\n' +
      '  "line 1\n' +
      '  line 2"\n' +
      ': 37\n' +
      '?\n' +
      '  "line 1\\\n' +
      '   line 2"\n' +
      ': 39\n';
    check(keyStrings, confDefault, RULE_ID, {
      problem1: [4, 1],
      problem3: [20, 3],
      problem4: [23, 2],
      problem5: [33, 3],
    });
  });

  test('quote type any', () => {
    const conf =
      'quoted-strings:\n' +
      '  check-keys: true\n' +
      '  quote-type: any\n' +
      'key-duplicates: disable\n';
    const keyStrings =
      '---\n' +
      'true: 2\n' +
      '123: 3\n' +
      'foo1: 4\n' +
      '"foo2": 5\n' +
      '"false": 6\n' +
      '"234": 7\n' +
      "'bar': 8\n" +
      '!!str generic_string: 9\n' +
      '!!str 456: 10\n' +
      '!!str "quoted_generic_string": 11\n' +
      '!!binary binstring: 12\n' +
      '!!int int_string: 13\n' +
      '!!bool bool_string: 14\n' +
      '!!bool "quoted_bool_string": 15\n' +
      '? - 16\n' +
      '  - 17\n' +
      ': 18\n' +
      '[119, 219]: 19\n' +
      '? a: 20\n' +
      '  "b": 21\n' +
      ': 22\n' +
      '{a: 123, "b": 223}: 23\n' +
      '? |\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 27\n' +
      '? >\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 31\n' +
      '?\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 35\n' +
      '?\n' +
      '  "line 1\n' +
      '  line 2"\n' +
      ': 37\n' +
      '?\n' +
      '  "line 1\\\n' +
      '   line 2"\n' +
      ': 39\n';
    check(keyStrings, conf, RULE_ID, {
      problem1: [4, 1],
      problem2: [20, 3],
      problem3: [23, 2],
      problem4: [33, 3],
    });
  });

  test('any quotes not required', () => {
    const conf =
      'quoted-strings:\n' +
      '  check-keys: true\n' +
      '  quote-type: any\n' +
      '  required: false\n' +
      'key-duplicates: disable\n';
    const keyStrings =
      '---\n' +
      'true: 2\n' +
      '123: 3\n' +
      'foo1: 4\n' +
      '"foo2": 5\n' +
      '"false": 6\n' +
      '"234": 7\n' +
      "'bar': 8\n" +
      '!!str generic_string: 9\n' +
      '!!str 456: 10\n' +
      '!!str "quoted_generic_string": 11\n' +
      '!!binary binstring: 12\n' +
      '!!int int_string: 13\n' +
      '!!bool bool_string: 14\n' +
      '!!bool "quoted_bool_string": 15\n' +
      '? - 16\n' +
      '  - 17\n' +
      ': 18\n' +
      '[119, 219]: 19\n' +
      '? a: 20\n' +
      '  "b": 21\n' +
      ': 22\n' +
      '{a: 123, "b": 223}: 23\n' +
      '? |\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 27\n' +
      '? >\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 31\n' +
      '?\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 35\n' +
      '?\n' +
      '  "line 1\n' +
      '  line 2"\n' +
      ': 37\n' +
      '?\n' +
      '  "line 1\\\n' +
      '   line 2"\n' +
      ': 39\n';
    check(keyStrings, conf, RULE_ID);
  });

  test('only when needed', () => {
    const conf =
      'quoted-strings:\n' +
      '  check-keys: true\n' +
      '  required: only-when-needed\n' +
      'key-duplicates: disable\n';
    const keyStrings =
      '---\n' +
      'true: 2\n' +
      '123: 3\n' +
      'foo1: 4\n' +
      '"foo2": 5\n' +
      '"false": 6\n' +
      '"234": 7\n' +
      "'bar': 8\n" +
      '!!str generic_string: 9\n' +
      '!!str 456: 10\n' +
      '!!str "quoted_generic_string": 11\n' +
      '!!binary binstring: 12\n' +
      '!!int int_string: 13\n' +
      '!!bool bool_string: 14\n' +
      '!!bool "quoted_bool_string": 15\n' +
      '? - 16\n' +
      '  - 17\n' +
      ': 18\n' +
      '[119, 219]: 19\n' +
      '? a: 20\n' +
      '  "b": 21\n' +
      ': 22\n' +
      '{a: 123, "b": 223}: 23\n' +
      '? |\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 27\n' +
      '? >\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 31\n' +
      '?\n' +
      '  line 1\n' +
      '  line 2\n' +
      ': 35\n' +
      '?\n' +
      '  "line 1\n' +
      '  line 2"\n' +
      ': 37\n' +
      '?\n' +
      '  "line 1\\\n' +
      '   line 2"\n' +
      ': 39\n';
    check(keyStrings, conf, RULE_ID, {
      problem1: [5, 1],
      problem2: [8, 1],
      problem3: [21, 3],
      problem4: [23, 10],
      problem5: [37, 3],
    });
  });

  test('only when needed corner cases', () => {
    const conf = 'quoted-strings:\n' + '  check-keys: true\n' + '  required: only-when-needed\n';
    check(
      '---\n' +
        '"": 2\n' +
        '"- item": 3\n' +
        '"key: value": 4\n' +
        '"%H:%M:%S": 5\n' +
        '"%wheel ALL=(ALL) NOPASSWD: ALL": 6\n' +
        '\'"quoted"\': 7\n' +
        "\"'foo' == 'bar'\": 8\n" +
        '"\'Mac\' in ansible_facts.product_name": 9\n' +
        "'foo # bar': 10\n",
      conf,
      RULE_ID
    );
    check(
      '---\n' +
        '"": 2\n' +
        '"- item": 3\n' +
        '"key: value": 4\n' +
        '"%H:%M:%S": 5\n' +
        '"%wheel ALL=(ALL) NOPASSWD: ALL": 6\n' +
        '\'"quoted"\': 7\n' +
        "\"'foo' == 'bar'\": 8\n" +
        '"\'Mac\' in ansible_facts.product_name": 9\n',
      conf,
      RULE_ID
    );
    check(
      '---\n' +
        '---: 2\n' +
        '"----": 3\n' +
        '---------: 4\n' +
        '"----------": 5\n' +
        ':wq: 6\n' +
        '":cw": 7\n',
      conf,
      RULE_ID,
      { problem1: [3, 1], problem2: [5, 1], problem3: [7, 1] }
    );
  });

  test('octal values', () => {
    const conf = 'quoted-strings:\n' + '  check-keys: true\n' + '  required: true\n';
    check(
      '---\n' +
        '100: 2\n' +
        '0100: 3\n' +
        '0o100: 4\n' +
        '777: 5\n' +
        '0777: 6\n' +
        '0o777: 7\n' +
        '800: 8\n' +
        '0800: 9\n' +
        '0o800: 10\n' +
        '"0900": 11\n' +
        '"0o900": 12\n',
      conf,
      RULE_ID,
      { problem1: [9, 1], problem2: [10, 1] }
    );
  });
});

describe('quoted-strings edge cases', () => {
  test('invalid regex in extra-required', () => {
    // Invalid regex patterns should be caught and not cause crashes
    const conf = 'quoted-strings:\n' + '  required: false\n' + '  extra-required: ["[invalid"]\n';
    // The invalid regex should be caught and treated as non-matching
    check('---\n' + 'foo: bar\n', conf, RULE_ID);
  });

  test('invalid regex in extra-allowed', () => {
    // Invalid regex patterns should be caught and not cause crashes
    const conf =
      'quoted-strings:\n' + '  required: only-when-needed\n' + '  extra-allowed: ["[invalid"]\n';
    check('---\n' + 'foo: "bar"\n', conf, RULE_ID, { problem1: [2, 6] });
  });

  test('consistent quote type', () => {
    // Test consistent quote type detection
    const conf = 'quoted-strings: {quote-type: consistent}';
    // First quoted string sets the style
    check('---\n' + 'a: "double"\n' + "b: 'single'\n", conf, RULE_ID, { problem1: [3, 4] });
    check('---\n' + "a: 'single'\n" + 'b: "double"\n', conf, RULE_ID, { problem1: [3, 4] });
  });

  test('flow context detection', () => {
    // Test flow context entry and exit
    const conf = 'quoted-strings: {required: only-when-needed}';
    // Inside flow context, commas and brackets require quotes
    check('---\n' + 'a: {b: "c,d"}\n', conf, RULE_ID);
    check('---\n' + 'a: [foo, "bar,baz"]\n', conf, RULE_ID);
  });

  test('tag handling', () => {
    // Test that tags are tracked and properly cleared
    const conf = 'quoted-strings: {required: true}';
    // Custom tags (!tag) still require quotes - only explicit types (!!str) exempt the value
    check('---\n' + 'a: !tag value\n', conf, RULE_ID, { problem1: [2, 9] });
    // Explicit type tags (!!str, !!int, etc.) exempt the value from requiring quotes
    check('---\n' + 'a: !!str value\n', conf, RULE_ID);
  });

  test('pending tag cleared on non-scalar', () => {
    // Test that pending tag is cleared when non-scalar token is encountered
    const conf = 'quoted-strings: {required: true}';
    check('---\n' + '!tag\n' + '- item\n', conf, RULE_ID, { problem1: [3, 3] });
  });

  test('only-when-needed with extra-required unquoted', () => {
    // Test extra-required with only-when-needed when value is unquoted
    const conf =
      'quoted-strings:\n' + '  required: only-when-needed\n' + '  extra-required: ["^http://"]\n';
    check('---\n' + 'url: http://example.com\n', conf, RULE_ID, { problem1: [2, 6] });
  });
});
