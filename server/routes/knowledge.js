import { Router } from 'express';
import Knowledge from '../models/Knowledge.js';
import { requireAdmin } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// Only these fields can be set from the outside.
const pick = (b) => ({ title: b.title, category: b.category, date: b.date || null, content: b.content });

// READ (public) – list everything, optionally ?category=event
router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.category ? { category: String(req.query.category) } : {};
  res.json(await Knowledge.find(filter).sort({ category: 1, date: 1, title: 1 }));
}));

// CREATE (admin)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  res.status(201).json(await Knowledge.create(pick(req.body)));
}));

// UPDATE (admin)
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const doc = await Knowledge.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
  if (!doc) return res.status(404).json({ error: 'Entry not found.' });
  res.json(doc);
}));

// DELETE (admin)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const doc = await Knowledge.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Entry not found.' });
  res.json({ ok: true });
}));

export default router;
