const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

app.post('/verify', (req, res) => {
  const { key, device_id } = req.body;
  if (!key) return res.json({ valid: false, message: 'No key provided' });
  if (!device_id) return res.json({ valid: false, message: 'No device ID' });

  const data = JSON.parse(fs.readFileSync('keys.json'));
  const found = data.keys.find(k => k.key === key);

  if (!found) return res.json({ valid: false, message: 'Invalid Key' });
  if (!found.active) return res.json({ valid: false, message: 'Key Disabled' });

  const today = new Date().toISOString().split('T')[0];
  if (found.expiry < today) return res.json({ valid: false, message: 'Key Expired' });

  // نظام هاتف واحد
  if (found.devices.length === 0) {
    found.devices.push(device_id);
    fs.writeFileSync('keys.json', JSON.stringify(data, null, 2));
    return res.json({ valid: true, message: 'Welcome to Smoke!' });
  }

  if (found.devices[0] === device_id) {
    return res.json({ valid: true, message: 'Welcome to Smoke!' });
  }

  return res.json({ valid: false, message: 'Key used on another device' });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Smoke Key Server Running!');
});  
