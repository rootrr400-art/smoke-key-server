const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const ADMIN_PASSWORD = 'smoke2024';

function loadKeys() {
  return JSON.parse(fs.readFileSync('keys.json'));
}
function saveKeys(data) {
  fs.writeFileSync('keys.json', JSON.stringify(data, null, 2));
}
function generateKey() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `USER-${part()}-${part()}-${part()}`;
}

// Verify key
app.post('/verify', (req, res) => {
  const { key, device_id } = req.body;
  if (!key) return res.json({ valid: false, message: 'No key provided' });
  if (!device_id) return res.json({ valid: false, message: 'No device ID' });

  const data = loadKeys();
  const found = data.keys.find(k => k.key === key);

  if (!found) return res.json({ valid: false, message: 'Invalid Key' });
  if (!found.active) return res.json({ valid: false, message: 'Key Disabled' });

  const today = new Date().toISOString().split('T')[0];
  if (found.expiry < today) return res.json({ valid: false, message: 'Key Expired' });

  if (found.devices.length === 0) {
    found.devices.push(device_id);
    saveKeys(data);
    return res.json({ valid: true, message: 'Welcome to Smoke!' });
  }
  if (found.devices[0] === device_id) {
    return res.json({ valid: true, message: 'Welcome to Smoke!' });
  }
  if (found.devices.length >= found.max_devices) {
    return res.json({ valid: false, message: 'Key used on another device' });
  }
  found.devices.push(device_id);
  saveKeys(data);
  return res.json({ valid: true, message: 'Welcome to Smoke!' });
});

// Admin - get all keys
app.post('/admin/keys', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.json({ success: false, message: 'Wrong password' });
  const data = loadKeys();
  res.json({ success: true, keys: data.keys });
});

// Admin - add key
app.post('/admin/add', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.json({ success: false, message: 'Wrong password' });

  const { days, max_devices } = req.body;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + parseInt(days || 30));

  const newKey = {
    key: generateKey(),
    expiry: expiry.toISOString().split('T')[0],
    active: true,
    max_devices: parseInt(max_devices || 1),
    devices: []
  };

  const data = loadKeys();
  data.keys.push(newKey);
  saveKeys(data);
  res.json({ success: true, key: newKey });
});

// Admin - toggle key
app.post('/admin/toggle', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.json({ success: false, message: 'Wrong password' });

  const data = loadKeys();
  const found = data.keys.find(k => k.key === req.body.key);
  if (!found) return res.json({ success: false, message: 'Key not found' });

  found.active = !found.active;
  saveKeys(data);
  res.json({ success: true, active: found.active });
});

// Admin - delete key
app.post('/admin/delete', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.json({ success: false, message: 'Wrong password' });

  const data = loadKeys();
  data.keys = data.keys.filter(k => k.key !== req.body.key);
  saveKeys(data);
  res.json({ success: true });
});

// Admin - reset devices
app.post('/admin/reset', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.json({ success: false, message: 'Wrong password' });

  const data = loadKeys();
  const found = data.keys.find(k => k.key === req.body.key);
  if (!found) return res.json({ success: false, message: 'Key not found' });

  found.devices = [];
  saveKeys(data);
  res.json({ success: true });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Smoke Key Server Running!');
});
