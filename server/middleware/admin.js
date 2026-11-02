// Very simple admin protection: the client sends the ADMIN_KEY in an x-admin-key header.
export function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || req.header('x-admin-key') !== expected) {
    return res.status(401).json({ error: 'Admin key is missing or wrong.' });
  }
  next();
}
