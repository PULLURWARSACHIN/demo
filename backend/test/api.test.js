'use strict';

const assert = require('node:assert/strict');
const { test, describe, before, after } = require('node:test');

const { createApp } = require('../app');

describe('HTTP API', () => {
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
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

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

  const badRequests = [
    ['division by zero', { operation: 'divide', a: 1, b: 0 }, /Division by zero/],
    ['a non-numeric operand', { operation: 'add', a: 'abc', b: 1 }, /finite number/],
    ['an empty operand', { operation: 'add', a: '', b: 1 }, /finite number/],
    ['an unsupported operation', { operation: 'pow', a: 2, b: 3 }, /Unsupported operation/],
    ['a malformed JSON body', '{"operation":', /valid JSON/],
    ['an unsafe integer', { operation: 'add', a: '9007199254740993', b: 1 }, /must be between/],
    ['an inherited operation name', { operation: '__proto__', a: 1, b: 2 }, /Unsupported operation/],
    ['a non-string operation', { operation: ['add'], a: 1, b: 2 }, /Unsupported operation/],
  ];

  for (const [name, body, expectedError] of badRequests) {
    test(`POST /api/calculate rejects ${name} with 400`, async () => {
      const response = await postCalculate(body);

      assert.equal(response.status, 400);
      assert.match((await response.json()).error, expectedError);
    });
  }

  test('oversized bodies return JSON 413, not 500', async () => {
    const response = await postCalculate(`{"operation":"add","a":1,"b":${'1'.repeat(200_000)}}`);

    assert.equal(response.status, 413);
    assert.match((await response.json()).error, /too large/);
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
