const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/verify', (req, res) => {
  const { key } = req.body;
  if (!key) return res.json({ valid: false, message: 'No key provided' });

  const data = JSON.parse(fs.readFileSync('keys.json'));
  const found = data.keys.find(k => k.key === key);

  if (!found) return res.json({ valid: false, message: 'Invalid Key' });
  if (!found.active) return res.json({ valid: false, message: 'Key Disabled' });

  const today = new Date().toISOString().split('T')[0];
  if (found.expiry < today) return res.json({ valid: false, message: 'Key Expired' });

  res.json({ valid: true, message: 'Welcome to Smoke!' });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Smoke Key Server Running!');
});
