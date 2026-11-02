import { Router } from 'express';
import Issue from '../models/Issue.js';
import { requireAdmin } from '../middleware/admin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// CREATE (public) – a student reports a problem
router.post('/', asyncHandler(async (req, res) => {
  const { studentName, email, category, description } = req.body;
  const issue = await Issue.create({ studentName, email, category, description });
  res.status(201).json({ id: issue._id, status: issue.status });
}));

// READ (admin) – all reports, newest first, optionally ?status=open
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  res.json(await Issue.find(filter).sort({ createdAt: -1 }));
}));

// UPDATE (admin) – change status
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const doc = await Issue.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!doc) return res.status(404).json({ error: 'Report not found.' });
  res.json(doc);
}));

// DELETE (admin)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const doc = await Issue.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Report not found.' });
  res.json({ ok: true });
}));

export default router;
