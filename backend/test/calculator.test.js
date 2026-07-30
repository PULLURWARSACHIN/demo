'use strict';

const assert = require('node:assert/strict');
const { test, describe } = require('node:test');

const { calculate, CalculationError } = require('../src/calculator');

describe('calculate', () => {
  test('adds, subtracts, multiplies and divides', () => {
    assert.equal(calculate({ operation: 'add', a: 2, b: 3 }).result, 5);
    assert.equal(calculate({ operation: 'subtract', a: 2, b: 3 }).result, -1);
    assert.equal(calculate({ operation: 'multiply', a: 2, b: 3 }).result, 6);
    assert.equal(calculate({ operation: 'divide', a: 6, b: 3 }).result, 2);
  });

  test('coerces numeric strings and returns the normalized operands', () => {
    assert.deepEqual(calculate({ operation: 'add', a: '1.5', b: ' 2.25 ' }), {
      operation: 'add',
      a: 1.5,
      b: 2.25,
      result: 3.75,
    });
  });

  test('rejects division by zero', () => {
    assert.throws(() => calculate({ operation: 'divide', a: 1, b: 0 }), CalculationError);
    assert.throws(() => calculate({ operation: 'divide', a: 0, b: 0 }), CalculationError);
  });

  test('rejects results that overflow to infinity', () => {
    assert.throws(
      () => calculate({ operation: 'divide', a: 9e15, b: 1e-320 }),
      /Result is out of range/
    );
  });

  test('rejects unsafe integers rather than silently rounding them', () => {
    assert.throws(
      () => calculate({ operation: 'add', a: '9007199254740993', b: 1 }),
      /must be between/
    );
    assert.throws(
      () => calculate({ operation: 'add', a: Number.MAX_SAFE_INTEGER + 2, b: 1 }),
      /must be between/
    );
    assert.equal(
      calculate({ operation: 'subtract', a: Number.MAX_SAFE_INTEGER, b: 1 }).result,
      Number.MAX_SAFE_INTEGER - 1
    );
  });

  test('rejects unsupported or missing operations', () => {
    assert.throws(() => calculate({ operation: 'modulo', a: 1, b: 2 }), CalculationError);
    assert.throws(() => calculate(), CalculationError);
  });

  test('rejects non-string and inherited operation names', () => {
    for (const bad of [['add'], { toString: () => 'add' }, '__proto__', 'constructor', 'toString', 'hasOwnProperty', null, 1]) {
      assert.throws(() => calculate({ operation: bad, a: 1, b: 2 }), CalculationError);
    }
  });

  test('rejects non-numeric operands', () => {
    for (const bad of ['', '  ', 'abc', null, undefined, {}, [], true, NaN, Infinity]) {
      assert.throws(() => calculate({ operation: 'add', a: bad, b: 1 }), CalculationError);
      assert.throws(() => calculate({ operation: 'add', a: 1, b: bad }), CalculationError);
    }
  });
});
