const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const authorize = require('../middlewares/authorize');
const { fileDownloadsTotal } = require('../config/prometheus-config');

// Require authentication (already done in server.js) AND specific role if needed
// For now, any authenticated user can download files, but we add the middleware for extensibility/defense in depth
router.get('/files', authorize(['user', 'admin']), (req, res) => {
  const filename = req.query.name;

  if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    fileDownloadsTotal.inc({ filename: 'invalid', status: 'bad_request' });
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const uploadsDir = path.join(__dirname, '../../uploads');
  const filepath = path.join(uploadsDir, filename);

  // Path Traversal Protection
  if (!filepath.startsWith(uploadsDir)) {
    fileDownloadsTotal.inc({ filename: filename, status: 'access_denied' });
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const content = fs.readFileSync(filepath);
    fileDownloadsTotal.inc({ filename: filename, status: 'success' });
    res.send(content);
  } catch {
    fileDownloadsTotal.inc({ filename: filename, status: 'not_found' });
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;
