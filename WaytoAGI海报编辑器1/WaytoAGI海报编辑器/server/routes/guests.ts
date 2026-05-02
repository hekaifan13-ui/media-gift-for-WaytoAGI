import { Router } from 'express';
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List all guests
router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM guests ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('[Guests] List error:', err);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// Create guest
router.post('/', async (req, res) => {
  try {
    const { name, title, image } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO guests (id, name, title, image) VALUES (?, ?, ?, ?)',
      [id, name, title || '', image || null]
    );
    res.status(201).json({ id, name, title: title || '', image: image || null });
  } catch (err) {
    console.error('[Guests] Create error:', err);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// Update guest
router.put('/:id', async (req, res) => {
  try {
    const { name, title, image } = req.body;
    const fields: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (image !== undefined) { fields.push('image = ?'); params.push(image); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    const [result] = await pool.query(`UPDATE guests SET ${fields.join(', ')} WHERE id = ?`, params);
    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Guests] Update error:', err);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// Delete guest
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM guests WHERE id = ?', [req.params.id]);
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Guests] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

export default router;
