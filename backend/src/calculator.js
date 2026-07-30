'use strict';

/**
 * Pure calculator logic, shared by the HTTP layer and the unit tests.
 */

const OPERATIONS = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
};

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
  const error = new CalculationError(`"${fieldName}" must be a finite number`);

  let parsed = value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      throw error;
    }
    parsed = Number(trimmed);
  }

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw error;
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
  const op = OPERATIONS[operation];

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
