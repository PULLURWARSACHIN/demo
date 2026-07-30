'use strict';

/**
 * Pure calculator logic, shared by the HTTP layer and the unit tests.
 */

// Null-prototype map so `operation` can never resolve an inherited member
// such as "__proto__", "constructor" or "toString".
const OPERATIONS = Object.assign(Object.create(null), {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
});

const SUPPORTED_OPERATIONS = Object.keys(OPERATIONS);

class CalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CalculationError';
  }
}

/**
 * Coerce an incoming JSON value into a finite number.
 * Accepts numbers and numeric strings; rejects everything else.
 */
function toNumber(value, fieldName) {
  // Empty/whitespace-only strings stay strings here so they fail the check below,
  // rather than silently coercing to 0 the way `Number('  ')` would.
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new CalculationError(`"${fieldName}" must be a finite number`);
  }

  // Integers beyond the safe range are silently rounded by JS, so reject them
  // instead of returning a value that is quietly wrong.
  if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
    throw new CalculationError(
      `"${fieldName}" must be between -${Number.MAX_SAFE_INTEGER} and ${Number.MAX_SAFE_INTEGER}`
    );
  }

  return parsed;
}

/**
 * Run a calculation.
 *
 * @param {{operation: string, a: unknown, b: unknown}} input
 * @returns {{operation: string, a: number, b: number, result: number}}
 * @throws {CalculationError} when the operation or operands are invalid
 */
function calculate({ operation, a, b } = {}) {
  const op = typeof operation === 'string' ? OPERATIONS[operation] : undefined;

  if (!op) {
    throw new CalculationError(
      `Unsupported operation "${operation}". Supported: ${SUPPORTED_OPERATIONS.join(', ')}`
    );
  }

  const left = toNumber(a, 'a');
  const right = toNumber(b, 'b');

  if (operation === 'divide' && right === 0) {
    throw new CalculationError('Division by zero is not allowed');
  }

  const result = op(left, right);

  if (!Number.isFinite(result)) {
    throw new CalculationError('Result is out of range');
  }

  return { operation, a: left, b: right, result };
}

module.exports = { calculate, CalculationError, SUPPORTED_OPERATIONS };
