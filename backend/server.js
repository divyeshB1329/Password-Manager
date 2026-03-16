/* eslint-env node */
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient } = require('mongodb');

dotenv.config();

const {
  MONGO_URI,
  DB_NAME,
  PORT = 3000,
  CLIENT_ORIGIN = 'http://localhost:5173',
  VAULT_KEY = 'default',
} = process.env;

if (!MONGO_URI || !DB_NAME) {
  throw new Error('Missing MONGO_URI or DB_NAME in backend/.env');
}

const app = express();
const client = new MongoClient(MONGO_URI);

app.use(
  cors({
    origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
  })
);
app.use(express.json({ limit: '1mb' }));

const getVaultCollection = () => client.db(DB_NAME).collection('vaults');

const isEncryptedItem = (item) =>
  item &&
  typeof item === 'object' &&
  typeof item.id === 'string' &&
  typeof item.iv === 'string' &&
  typeof item.ciphertext === 'string';

const validateVaultPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Vault payload is required.';
  }

  if (payload.version !== 2) {
    return 'Vault version must be 2.';
  }

  if (typeof payload.salt !== 'string' || payload.salt.length === 0) {
    return 'Vault salt is required.';
  }

  if (!Array.isArray(payload.items) || !payload.items.every(isEncryptedItem)) {
    return 'Vault items must be an array of encrypted entries.';
  }

  return null;
};

app.get('/api/health', async (req, res) => {
  try {
    await client.db(DB_NAME).command({ ping: 1 });
    res.json({ ok: true, database: DB_NAME });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Database ping failed.' });
  }
});

app.get('/api/vault', async (req, res) => {
  try {
    const vault = await getVaultCollection().findOne(
      { vaultKey: VAULT_KEY },
      { projection: { _id: 0, version: 1, salt: 1, items: 1, updatedAt: 1 } }
    );

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found.' });
    }

    return res.json(vault);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching vault.' });
  }
});

app.put('/api/vault', async (req, res) => {
  const validationError = validateVaultPayload(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const nextVault = {
      vaultKey: VAULT_KEY,
      version: req.body.version,
      salt: req.body.salt,
      items: req.body.items,
      updatedAt: new Date(),
    };

    await getVaultCollection().updateOne(
      { vaultKey: VAULT_KEY },
      { $set: nextVault },
      { upsert: true }
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: 'Error saving vault.' });
  }
});

const startServer = async () => {
  try {
    await client.connect();
    await client.db(DB_NAME).command({ ping: 1 });
    console.log(`MongoDB connected: ${DB_NAME}`);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await client.close();
  process.exit(0);
});

startServer();
