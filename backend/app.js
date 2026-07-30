'use strict';

const path = require('path');
const express = require('express');

const { calculate, CalculationError, SUPPORTED_OPERATIONS } = require('./src/calculator');

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

function createApp() {
  const app = express();

  app.use(express.json());

  // Health check.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', operations: SUPPORTED_OPERATIONS });
  });

  // Calculation endpoint: { operation, a, b } -> { operation, a, b, result }
  app.post('/api/calculate', (req, res) => {
    try {
      res.json(calculate(req.body));
    } catch (error) {
      if (error instanceof CalculationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Unexpected error while calculating:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Static frontend (served from the same origin, so the UI uses relative API paths).
  app.use(express.static(FRONTEND_DIR));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}

module.exports = { createApp };
