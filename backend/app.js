'use strict';

const path = require('path');
const express = require('express');

const { calculate, CalculationError, SUPPORTED_OPERATIONS } = require('./src/calculator');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', operations: SUPPORTED_OPERATIONS });
  });

  app.post('/api/calculate', (req, res) => {
    res.json(calculate(req.body));
  });

  // Static frontend, served from the same origin so the UI can use relative API paths.
  app.use(express.static(FRONTEND_DIR));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Keep every /api failure on the documented { error } JSON shape, including the
  // SyntaxError express.json() throws for malformed request bodies.
  app.use((error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof CalculationError) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Request-parsing failures (express.json) already carry a meaningful 4xx
    // status: 400 for malformed JSON, 413 for an oversized payload.
    const status = error?.status ?? error?.statusCode;

    if (Number.isInteger(status) && status >= 400 && status < 500) {
      const message =
        status === 413 ? 'Request body is too large' : 'Request body must be valid JSON';
      res.status(status).json({ error: message });
      return;
    }

    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
