import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDb = path.join(os.tmpdir(), `ats-test-${Date.now()}.db`);
process.env.DB_PATH = tmpDb;

const { db, ensureStages } = await import('../db.js');
const { default: candidatesRouter } = await import('../routes/candidates.js');
const { default: dashboardRouter } = await import('../routes/dashboard.js');

async function createApp() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/candidates', candidatesRouter);
  app.use('/api/dashboard', dashboardRouter);
  return app;
}

let app;
let server;
let baseUrl;

before(async () => {
  ensureStages();
  app = await createApp();
  await new Promise(resolve => { server = app.listen(0, resolve); });
  baseUrl = `http://localhost:${server.address().port}`;
});

test('health check works', async () => {
  const res = await fetch(`${baseUrl}/api/candidates`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(await res.json()));
});

test('creates a candidate', async () => {
  const res = await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', role: 'QA Engineer', skills: 'Selenium' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.name, 'Test User');
  assert.equal(body.stage_name, 'Applied');
});

test('rejects invalid candidate data', async () => {
  const res = await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'not-an-email', role: '' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.errors.length >= 2);
});

test('rejects duplicate email', async () => {
  const res = await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dup User', email: 'test@example.com', role: 'QA Engineer' }),
  });
  assert.equal(res.status, 409);
});

test('searches candidates by query', async () => {
  await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Searchable Person', email: 'search@example.com', role: 'DevOps Engineer' }),
  });
  const res = await fetch(`${baseUrl}/api/candidates?q=Searchable`);
  const body = await res.json();
  assert.equal(body.length, 1);
  assert.equal(body[0].name, 'Searchable Person');
});

test('filters candidates by stage', async () => {
  const res = await fetch(`${baseUrl}/api/candidates?stage=Applied`);
  const body = await res.json();
  assert.ok(body.length >= 2);
  assert.ok(body.every(c => c.stage_name === 'Applied'));
});

test('moves candidate through stages', async () => {
  const created = await (await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pipeline Person', email: 'pipeline@example.com', role: 'Backend Engineer' }),
  })).json();

  const res = await fetch(`${baseUrl}/api/candidates/${created.id}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'Interview', note: 'Passed screening' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.stage_name, 'Interview');

  const detail = await (await fetch(`${baseUrl}/api/candidates/${created.id}`)).json();
  assert.ok(detail.activities.some(a => a.message.includes('Passed screening')));
});

test('rejects invalid stage transition', async () => {
  const created = await (await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Invalid Move', email: 'invalid@example.com', role: 'QA Engineer' }),
  })).json();
  const res = await fetch(`${baseUrl}/api/candidates/${created.id}/stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: 'Nonexistent' }),
  });
  assert.equal(res.status, 400);
});

test('updates a candidate', async () => {
  const created = await (await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Update Me', email: 'update@example.com', role: 'QA Engineer' }),
  })).json();
  const res = await fetch(`${baseUrl}/api/candidates/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ experience_years: 7 }),
  });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).experience_years, 7);
});

test('deletes a candidate', async () => {
  const created = await (await fetch(`${baseUrl}/api/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Delete Me', email: 'delete@example.com', role: 'QA Engineer' }),
  })).json();
  const res = await fetch(`${baseUrl}/api/candidates/${created.id}`, { method: 'DELETE' });
  assert.equal(res.status, 200);
  const gone = await fetch(`${baseUrl}/api/candidates/${created.id}`);
  assert.equal(gone.status, 404);
});

test('dashboard metrics return expected shape', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.total > 0);
  assert.ok(Array.isArray(body.byStage));
  assert.ok(body.byStage.length === 6);
  assert.ok(typeof body.conversionRate === 'number');
  assert.ok(Array.isArray(body.recent));
});

test('returns 404 for missing candidate', async () => {
  const res = await fetch(`${baseUrl}/api/candidates/99999`);
  assert.equal(res.status, 404);
});

test('closes server and cleans up', async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  fs.rmSync(tmpDb, { force: true });
});
