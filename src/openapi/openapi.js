const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

router.get('/openapi.json', (req, res) => {
    const openapiPath = path.join(__dirname, 'openapi.json');
    const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf8'));
    res.json(openapi);
});


module.exports = router;
