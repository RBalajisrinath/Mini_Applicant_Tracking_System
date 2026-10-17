import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

const CANDIDATE_SELECT = `
  SELECT c.*, s.name AS stage_name, s.position AS stage_position, s.is_terminal
  FROM candidates c
  JOIN stages s ON s.id = c.stage_id
`;

function validateCandidate(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) errors.push('name is required');
  if (!body.email || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('valid email is required');
  if (!body.role || typeof body.role !== 'string' || !body.role.trim()) errors.push('role is required');
  if (body.experience_years !== undefined && (isNaN(Number(body.experience_years)) || Number(body.experience_years) < 0)) {
    errors.push('experience_years must be a non-negative number');
  }
  return errors;
}

router.get('/', (req, res) => {
  const { q, stage, role, status, sort = 'updated_at', order = 'desc' } = req.query;

  const where = [];
  const params = [];

  if (q) {
    where.push('(c.name LIKE ? OR c.email LIKE ? OR c.role LIKE ? OR c.skills LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (stage) {
    where.push('s.name = ?');
    params.push(stage);
  }
  if (role) {
    where.push('c.role = ?');
    params.push(role);
  }
  if (status === 'active') where.push('s.is_terminal = 0');
  if (status === 'hired') where.push("s.name = 'Hired'");
  if (status === 'rejected') where.push("s.name = 'Rejected'");

  let sql = CANDIDATE_SELECT;
  if (where.length) sql += ' WHERE ' + where.join(' AND ');

  const allowedSort = { updated_at: 'c.updated_at', created_at: 'c.created_at', name: 'c.name', experience: 'c.experience_years' };
  const sortCol = allowedSort[sort] || 'c.updated_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortCol} ${sortOrder}`;

  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/meta/filters', (req, res) => {
  const stages = db.prepare('SELECT name FROM stages ORDER BY position').all().map(r => r.name);
  const roles = db.prepare('SELECT DISTINCT role FROM candidates ORDER BY role').all().map(r => r.role);
  res.json({ stages, roles });
});

router.get('/:id', (req, res) => {
  const candidate = db.prepare(CANDIDATE_SELECT + ' WHERE c.id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  const activities = db.prepare(
    'SELECT * FROM activities WHERE candidate_id = ? ORDER BY created_at DESC, id DESC'
  ).all(req.params.id);
  res.json({ ...candidate, activities });
});

router.post('/', (req, res) => {
  const errors = validateCandidate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, email, phone = null, role, experience_years = 0, skills = '', notes = '', stage = 'Applied' } = req.body;

  const stageRow = db.prepare('SELECT id FROM stages WHERE name = ?').get(stage);
  if (!stageRow) return res.status(400).json({ errors: [`stage must be one of: ${db.prepare('SELECT name FROM stages').all().map(r => r.name).join(', ')}`] });

  try {
    const info = db.prepare(`
      INSERT INTO candidates (name, email, phone, role, experience_years, skills, notes, stage_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), phone, role.trim(), Number(experience_years) || 0, skills, notes, stageRow.id);

    db.prepare('INSERT INTO activities (candidate_id, type, message) VALUES (?, ?, ?)')
      .run(info.lastInsertRowid, 'created', `Application received for ${role}`);

    const created = db.prepare(CANDIDATE_SELECT + ' WHERE c.id = ?').get(info.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ errors: ['A candidate with this email already exists'] });
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Candidate not found' });

  const merged = { ...existing, ...req.body };
  const errors = validateCandidate(merged);
  if (errors.length) return res.status(400).json({ errors });

  const { name, email, phone, role, experience_years, skills, notes } = req.body;
  db.prepare(`
    UPDATE candidates SET name = ?, email = ?, phone = ?, role = ?, experience_years = ?, skills = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? existing.name,
    (email ?? existing.email).toLowerCase(),
    phone !== undefined ? phone : existing.phone,
    role ?? existing.role,
    experience_years !== undefined ? Number(experience_years) : existing.experience_years,
    skills !== undefined ? skills : existing.skills,
    notes !== undefined ? notes : existing.notes,
    req.params.id
  );

  const updated = db.prepare(CANDIDATE_SELECT + ' WHERE c.id = ?').get(req.params.id);
  res.json(updated);
});

router.post('/:id/stage', (req, res) => {
  const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  const { stage, note = '' } = req.body;
  if (!stage) return res.status(400).json({ errors: ['stage is required'] });

  const stageRow = db.prepare('SELECT * FROM stages WHERE name = ?').get(stage);
  if (!stageRow) return res.status(400).json({ errors: ['invalid stage name'] });
  if (stageRow.id === candidate.stage_id) return res.status(400).json({ errors: ['Candidate is already in this stage'] });

  db.prepare("UPDATE candidates SET stage_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(stageRow.id, req.params.id);

  const message = note.trim()
    ? `Moved to ${stage}: ${note.trim()}`
    : `Stage changed to ${stage}`;
  db.prepare('INSERT INTO activities (candidate_id, type, message) VALUES (?, ?, ?)')
    .run(req.params.id, 'stage_change', message);

  const updated = db.prepare(CANDIDATE_SELECT + ' WHERE c.id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Candidate not found' });
  res.json({ deleted: true });
});

export default router;
