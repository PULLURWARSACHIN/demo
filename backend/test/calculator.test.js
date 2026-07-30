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

  test('accepts numeric strings and decimals', () => {
    assert.equal(calculate({ operation: 'add', a: '1.5', b: ' 2.25 ' }).result, 3.75);
  });

  test('returns the normalized operands', () => {
    assert.deepEqual(calculate({ operation: 'add', a: '4', b: 1 }), {
      operation: 'add',
      a: 4,
      b: 1,
      result: 5,
    });
  });

  test('rejects division by zero', () => {
    assert.throws(() => calculate({ operation: 'divide', a: 1, b: 0 }), CalculationError);
  });

  test('rejects unsupported operations', () => {
    assert.throws(() => calculate({ operation: 'modulo', a: 1, b: 2 }), CalculationError);
    assert.throws(() => calculate(), CalculationError);
  });

  test('rejects non-numeric operands', () => {
    for (const bad of ['', '  ', 'abc', null, undefined, {}, [], true, NaN, Infinity]) {
      assert.throws(() => calculate({ operation: 'add', a: bad, b: 1 }), CalculationError);
      assert.throws(() => calculate({ operation: 'add', a: 1, b: bad }), CalculationError);
    }
  });
});
