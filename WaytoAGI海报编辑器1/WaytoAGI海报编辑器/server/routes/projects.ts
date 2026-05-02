import { Router } from 'express';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List all projects (lightweight — no full data field)
router.get('/', async (req, res) => {
  try {
    const templateId = req.query.templateId as string | undefined;
    let sql = 'SELECT id, name, template_id, thumbnail, created_at, updated_at FROM projects ORDER BY updated_at DESC';
    const params: string[] = [];

    if (templateId) {
      sql = 'SELECT id, name, template_id, thumbnail, created_at, updated_at FROM projects WHERE template_id = ? ORDER BY updated_at DESC';
      params.push(templateId);
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[Projects] List error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project with full data
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    const results = rows as any[];
    if (results.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = results[0];
    // Parse JSON data field
    if (typeof project.data === 'string') {
      project.data = JSON.parse(project.data);
    }
    res.json(project);
  } catch (err) {
    console.error('[Projects] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { name, templateId, data, thumbnail } = req.body;
    if (!name || !templateId || !data) {
      return res.status(400).json({ error: 'Missing required fields: name, templateId, data' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO projects (id, name, template_id, data, thumbnail) VALUES (?, ?, ?, ?, ?)',
      [id, name, templateId, JSON.stringify(data), thumbnail || null]
    );
    res.status(201).json({ id, name, templateId });
  } catch (err) {
    console.error('[Projects] Create error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, templateId, data, thumbnail } = req.body;
    const fields: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (templateId !== undefined) { fields.push('template_id = ?'); params.push(templateId); }
    if (data !== undefined) { fields.push('data = ?'); params.push(JSON.stringify(data)); }
    if (thumbnail !== undefined) { fields.push('thumbnail = ?'); params.push(thumbnail); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Projects] Update error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Projects] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
