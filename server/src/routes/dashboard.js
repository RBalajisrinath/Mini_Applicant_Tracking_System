import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/metrics', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM candidates').get().c;

  const byStage = db.prepare(`
    SELECT s.name AS stage, s.position, COUNT(c.id) AS count
    FROM stages s
    LEFT JOIN candidates c ON c.stage_id = s.id
    GROUP BY s.id
    ORDER BY s.position
  `).all();

  const byRole = db.prepare(`
    SELECT role, COUNT(*) AS count FROM candidates GROUP BY role ORDER BY count DESC
  `).all();

  const hired = db.prepare("SELECT COUNT(*) AS c FROM candidates c JOIN stages s ON s.id = c.stage_id WHERE s.name = 'Hired'").get().c;
  const rejected = db.prepare("SELECT COUNT(*) AS c FROM candidates c JOIN stages s ON s.id = c.stage_id WHERE s.name = 'Rejected'").get().c;
  const active = total - hired - rejected;

  const recent = db.prepare(`
    SELECT a.id, a.type, a.message, a.created_at, c.name AS candidate_name, c.id AS candidate_id
    FROM activities a
    JOIN candidates c ON c.id = a.candidate_id
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 10
  `).all();

  const recentCandidates = db.prepare(`
    SELECT id, name, role, created_at FROM candidates ORDER BY created_at DESC, id DESC LIMIT 5
  `).all();

  const avgExperience = db.prepare('SELECT AVG(experience_years) AS avg FROM candidates').get().avg;

  const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;

  res.json({
    total,
    active,
    hired,
    rejected,
    conversionRate,
    avgExperience: Math.round(avgExperience * 10) / 10,
    byStage,
    byRole,
    recent,
    recentCandidates,
  });
});

export default router;
