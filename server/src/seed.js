import { db, ensureStages } from './db.js';

const FIRST = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Divya', 'Karan', 'Meera', 'Rahul', 'Ishita', 'Aditya', 'Kavya', 'Nikhil', 'Pooja', 'Siddharth', 'Tanvi', 'Varun', 'Nisha', 'Manish', 'Riya', 'Deepak', 'Shreya'];
const LAST = ['Sharma', 'Patel', 'Iyer', 'Khan', 'Reddy', 'Nair', 'Gupta', 'Mehta', 'Singh', 'Das', 'Joshi', 'Bose'];
const ROLES = ['Frontend Engineer', 'Backend Engineer', 'Full Stack Developer', 'DevOps Engineer', 'QA Engineer', 'Data Analyst', 'Product Manager', 'UI/UX Designer'];
const SKILL_SETS = [
  'JavaScript,React,Node.js',
  'Python,Django,PostgreSQL',
  'Java,Spring Boot,AWS',
  'TypeScript,Next.js,GraphQL',
  'Go,Docker,Kubernetes',
  'React Native,MongoDB,Firebase',
  'Selenium,Java,Cypress',
  'SQL,Power BI,Python',
  'Figma,Prototyping,User Research',
  'C#,Azure,.NET',
];
const STAGE_NAMES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seed() {
  ensureStages();
  const existing = db.prepare('SELECT COUNT(*) AS c FROM candidates').get().c;
  if (existing > 0) {
    console.log(`Database already has ${existing} candidates. Skipping seed.`);
    return;
  }

  const stageIds = {};
  for (const row of db.prepare('SELECT id, name FROM stages').all()) {
    stageIds[row.name] = row.id;
  }

  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, email, phone, role, experience_years, skills, notes, stage_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertActivity = db.prepare(`
    INSERT INTO activities (candidate_id, type, message) VALUES (?, ?, ?)
  `);

  const usedEmails = new Set();
  const count = 42;

  db.exec('BEGIN');
  try {
    for (let i = 0; i < count; i++) {
      const name = `${rand(FIRST)} ${rand(LAST)}`;
      let email = name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + '@example.com';
      while (usedEmails.has(email)) {
        email = email.replace('@', `${Math.floor(Math.random() * 100)}@`);
      }
      usedEmails.add(email);

      const role = rand(ROLES);
      const r = Math.random();
      const stage = r < 0.28 ? 'Applied'
        : r < 0.50 ? 'Screening'
        : r < 0.68 ? 'Interview'
        : r < 0.82 ? 'Offer'
        : r < 0.92 ? 'Hired' : 'Rejected';

      const exp = Math.floor(Math.random() * 12) + 1;
      const skills = rand(SKILL_SETS);
      const notes = rand([
        'Strong portfolio, good cultural fit.',
        'Referred by current employee.',
        'Needs visa sponsorship.',
        'Impressive system design round.',
        'Follow-up interview scheduled.',
        'Salary expectations above budget.',
        'Fast learner, great communication.',
        'Switching from a non-tech background.',
      ]);

      const info = insertCandidate.run(
        name,
        email,
        `+1-555-${String(Math.floor(1000 + Math.random() * 9000))}`,
        role,
        exp,
        skills,
        notes,
        stageIds[stage]
      );
      const candidateId = info.lastInsertRowid;
      insertActivity.run(candidateId, 'created', `Application received for ${role}`);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log(`Seeded ${count} candidates.`);
}

seed();
