'use strict';

const assert = require('node:assert/strict');
const { test, describe, before, after } = require('node:test');

const { createApp } = require('../app');

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function postCalculate(body) {
  return fetch(`${baseUrl}/api/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('HTTP API', () => {
  test('GET /api/health reports available operations', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.deepEqual(body.operations, ['add', 'subtract', 'multiply', 'divide']);
  });

  test('POST /api/calculate returns the result', async () => {
    const response = await postCalculate({ operation: 'multiply', a: 7, b: 6 });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      operation: 'multiply',
      a: 7,
      b: 6,
      result: 42,
    });
  });

  test('POST /api/calculate rejects bad input with 400', async () => {
    const divideByZero = await postCalculate({ operation: 'divide', a: 1, b: 0 });
    assert.equal(divideByZero.status, 400);
    assert.match((await divideByZero.json()).error, /Division by zero/);

    const badOperand = await postCalculate({ operation: 'add', a: 'abc', b: 1 });
    assert.equal(badOperand.status, 400);
    assert.match((await badOperand.json()).error, /finite number/);

    const badOperation = await postCalculate({ operation: 'pow', a: 2, b: 3 });
    assert.equal(badOperation.status, 400);
    assert.match((await badOperation.json()).error, /Unsupported operation/);
  });

  test('unknown API routes return JSON 404', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'Not found' });
  });

  test('serves the frontend at /', async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<title>Calculator<\/title>/);
  });
});
