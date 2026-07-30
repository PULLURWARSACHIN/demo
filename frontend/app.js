'use strict';

const OPERATION_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

const form = document.getElementById('calc-form');
const aInput = document.getElementById('a');
const bInput = document.getElementById('b');
const operationSelect = document.getElementById('operation');
const submitButton = document.getElementById('submit');
const resultEl = document.getElementById('result');

function showResult(text, isError = false) {
  resultEl.textContent = text;
  resultEl.classList.toggle('error', isError);
}

async function calculate(payload) {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    operation: operationSelect.value,
    a: aInput.value,
    b: bInput.value,
  };

  submitButton.disabled = true;
  showResult('Calculating…');

  try {
    const { a, b, operation, result } = await calculate(payload);
    showResult(`${a} ${OPERATION_SYMBOLS[operation] || operation} ${b} = ${result}`);
  } catch (error) {
    showResult(error.message || 'Something went wrong', true);
  } finally {
    submitButton.disabled = false;
  }
});
