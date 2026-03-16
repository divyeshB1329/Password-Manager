import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'passwords';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMPTY_FORM = { site: '', userName: '', password: '' };
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toastOptions = {
  position: 'top-right',
  autoClose: 1200,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark',
};

const arrayBufferToBase64 = (buffer) =>
  window.btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToUint8Array = (value) =>
  Uint8Array.from(window.atob(value), (char) => char.charCodeAt(0));

const createVaultSalt = () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt);
};

const deriveVaultKey = async (masterPassword, salt) => {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToUint8Array(salt),
      iterations: 250000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptItem = async (item, masterPassword, salt) => {
  const key = await deriveVaultKey(masterPassword, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = textEncoder.encode(JSON.stringify(item));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, payload);

  return {
    id: item.id,
    iv: arrayBufferToBase64(iv),
    ciphertext: arrayBufferToBase64(encrypted),
  };
};

const decryptItem = async (item, masterPassword, salt) => {
  const key = await deriveVaultKey(masterPassword, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToUint8Array(item.iv) },
    key,
    base64ToUint8Array(item.ciphertext)
  );

  return JSON.parse(textDecoder.decode(decrypted));
};

const parseStoredVault = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { mode: 'new', salt: '', encryptedItems: [], legacyItems: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { mode: 'legacy', salt: '', encryptedItems: [], legacyItems: parsed };
    }

    if (parsed?.version === 2 && Array.isArray(parsed.items) && typeof parsed.salt === 'string') {
      return {
        mode: 'locked',
        salt: parsed.salt,
        encryptedItems: parsed.items,
        legacyItems: [],
      };
    }
  } catch {
    return { mode: 'corrupt', salt: '', encryptedItems: [], legacyItems: [] };
  }

  return { mode: 'corrupt', salt: '', encryptedItems: [], legacyItems: [] };
};

const buildVaultPayload = (salt, items) => ({
  version: 2,
  salt,
  items,
});

const saveVaultToLocal = (payload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const fetchVaultFromApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/vault`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Unable to fetch vault.');
  }

  return response.json();
};

const saveVaultToApi = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/api/vault`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Unable to save vault.');
  }
};

const getSafeSiteUrl = (site) => {
  const trimmedSite = site.trim();
  if (!trimmedSite) {
    return null;
  }

  try {
    const normalizedSite = /^https?:\/\//i.test(trimmedSite) ? trimmedSite : `https://${trimmedSite}`;
    const url = new URL(normalizedSite);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
};

const maskPassword = (password) => '*'.repeat(Math.max(password.length, 8));

const Manager = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordArray, setPasswordArray] = useState([]);
  const [encryptedItems, setEncryptedItems] = useState([]);
  const [legacyItems, setLegacyItems] = useState([]);
  const [vaultMode, setVaultMode] = useState('new');
  const [vaultSalt, setVaultSalt] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');

  const applyStoredVault = (storedVault) => {
    setVaultMode(storedVault.mode);
    setVaultSalt(storedVault.salt);
    setEncryptedItems(storedVault.encryptedItems);
    setLegacyItems(storedVault.legacyItems);

    if (storedVault.mode === 'corrupt') {
      toast.error('Saved vault data is corrupted.', toastOptions);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeVault = async () => {
      try {
        const remoteVault = await fetchVaultFromApi();

        if (!isMounted) {
          return;
        }

        if (remoteVault) {
          saveVaultToLocal(remoteVault);
          applyStoredVault({
            mode: 'locked',
            salt: remoteVault.salt,
            encryptedItems: remoteVault.items,
            legacyItems: [],
          });
        } else {
          applyStoredVault(parseStoredVault());
        }

        setBackendStatus('connected');
      } catch {
        if (!isMounted) {
          return;
        }

        applyStoredVault(parseStoredVault());
        setBackendStatus('offline');
      } finally {
        if (isMounted) {
          setIsInitialLoad(false);
        }
      }
    };

    initializeVault();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistEncryptedItems = async (items, password, salt) => {
    const nextEncryptedItems = await Promise.all(
      items.map((item) => encryptItem(item, password, salt))
    );

    const payload = buildVaultPayload(salt, nextEncryptedItems);
    saveVaultToLocal(payload);
    setEncryptedItems(nextEncryptedItems);
    try {
      await saveVaultToApi(payload);
      setBackendStatus('connected');
      return { nextEncryptedItems, synced: true };
    } catch {
      setBackendStatus('offline');
      return { nextEncryptedItems, synced: false };
    }
  };

  const unlockVault = async () => {
    const trimmedMasterPassword = masterPassword.trim();
    if (trimmedMasterPassword.length < 8) {
      toast.error('Use at least 8 characters for the master password.', toastOptions);
      return;
    }

    setIsSubmitting(true);

    try {
      if (vaultMode === 'legacy') {
        const nextSalt = createVaultSalt();
        const { synced } = await persistEncryptedItems(legacyItems, trimmedMasterPassword, nextSalt);
        if (!synced) {
          toast.warning('Vault saved locally. Backend sync failed.', toastOptions);
        }
        setPasswordArray(legacyItems);
        setVaultSalt(nextSalt);
        setLegacyItems([]);
        setVaultMode('unlocked');
        toast.success('Legacy passwords secured successfully.', toastOptions);
        return;
      }

      if (vaultMode === 'new') {
        const nextSalt = createVaultSalt();
        const { synced } = await persistEncryptedItems([], trimmedMasterPassword, nextSalt);
        if (!synced) {
          toast.warning('Vault created locally. Backend sync failed.', toastOptions);
        }
        setPasswordArray([]);
        setVaultSalt(nextSalt);
        setVaultMode('unlocked');
        toast.success('Vault created successfully.', toastOptions);
        return;
      }

      if (vaultMode === 'locked') {
        const decryptedItems = await Promise.all(
          encryptedItems.map((item) => decryptItem(item, trimmedMasterPassword, vaultSalt))
        );
        setPasswordArray(decryptedItems);
        setVaultMode('unlocked');
        toast.success('Vault unlocked.', toastOptions);
      }
    } catch {
      toast.error('Unable to unlock vault. Check the master password.', toastOptions);
    } finally {
      setIsSubmitting(false);
    }
  };

  const lockVault = () => {
    setPasswordArray([]);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowFormPassword(false);
    setVaultMode(encryptedItems.length || vaultSalt ? 'locked' : 'new');
    toast.success('Vault locked.', toastOptions);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard.', toastOptions);
    } catch {
      toast.error('Clipboard copy failed.', toastOptions);
    }
  };

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const savePassword = async () => {
    if (vaultMode !== 'unlocked') {
      toast.error('Unlock the vault before saving passwords.', toastOptions);
      return;
    }

    const trimmedForm = {
      site: form.site.trim(),
      userName: form.userName.trim(),
      password: form.password,
    };

    if (trimmedForm.site.length <= 3 || !trimmedForm.userName || !trimmedForm.password) {
      toast.error('Enter a valid site, username, and password.', toastOptions);
      return;
    }

    const nextItem = {
      ...trimmedForm,
      id: editingId ?? uuidv4(),
    };

    const nextPasswords = editingId
      ? passwordArray.map((item) => (item.id === editingId ? nextItem : item))
      : [...passwordArray, nextItem];

    setIsSubmitting(true);

    try {
      const { synced } = await persistEncryptedItems(nextPasswords, masterPassword.trim(), vaultSalt);
      setPasswordArray(nextPasswords);
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowFormPassword(false);
      toast.success(
        synced
          ? editingId
            ? 'Password updated successfully.'
            : 'Password saved successfully.'
          : editingId
            ? 'Updated locally. Backend sync pending.'
            : 'Saved locally. Backend sync pending.',
        toastOptions
      );
    } catch {
      toast.error('Unable to save password.', toastOptions);
    } finally {
      setIsSubmitting(false);
    }
  };

  const editPassword = (id) => {
    const currentPassword = passwordArray.find((item) => item.id === id);
    if (!currentPassword) {
      return;
    }

    setForm({
      site: currentPassword.site,
      userName: currentPassword.userName,
      password: currentPassword.password,
    });
    setEditingId(id);
    setShowFormPassword(true);
  };

  const deletePassword = async (id) => {
    const confirmed = window.confirm('Do you want to delete this password?');
    if (!confirmed) {
      return;
    }

    const nextPasswords = passwordArray.filter((item) => item.id !== id);
    setIsSubmitting(true);

    try {
      const { synced } = await persistEncryptedItems(nextPasswords, masterPassword.trim(), vaultSalt);
      setPasswordArray(nextPasswords);
      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      toast.success(synced ? 'Password deleted.' : 'Deleted locally. Backend sync pending.', toastOptions);
    } catch {
      toast.error('Unable to delete password.', toastOptions);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="md:mycontainer m-auto w-[90%] p-0 py-4 pb-0 md:px-40">
        <h1 className="text-center text-4xl font-bold text-green-700">
          &lt; PASS <span className="text-green-700">OP&gt;</span>
        </h1>
        <p className="text-center text-lg text-green-900">Your encrypted password manager</p>
        <p className="mt-2 text-center text-sm text-slate-700">
          {backendStatus === 'connected'
            ? 'Backend sync active.'
            : backendStatus === 'offline'
              ? 'Local encrypted vault active.'
              : 'Checking backend connection...'}
        </p>

        <div className="mt-6 rounded-2xl border border-green-300 bg-white/70 p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-green-900">Vault Access</h2>
          <p className="mt-1 text-sm text-slate-700">
            First time? Enter a new master password.
            {vaultMode === 'legacy'
              ? ' Legacy passwords were found. Set a master password to encrypt them.'
              : ' Existing users can enter the same password to unlock the vault.'}
          </p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={masterPassword}
              onChange={(event) => setMasterPassword(event.target.value)}
              placeholder="Enter master password"
              className="w-full rounded-full border border-green-500 p-4 py-2"
              type="password"
              name="masterPassword"
              disabled={isInitialLoad}
            />
            <button
              type="button"
              onClick={unlockVault}
              disabled={isInitialLoad || isSubmitting || vaultMode === 'unlocked'}
              className="shrink-0 whitespace-nowrap rounded-full border border-green-900 bg-green-500 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {vaultMode === 'unlocked' ? 'Unlocked' : 'Create / Unlock Vault'}
            </button>
            <button
              type="button"
              onClick={lockVault}
              disabled={isInitialLoad || vaultMode !== 'unlocked'}
              className="rounded-full border border-slate-700 bg-slate-700 px-5 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Lock
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-4 text-black md:gap-8">
          <input
            value={form.site}
            onChange={handleChange}
            placeholder="Enter website URL"
            className="w-full rounded-full border border-green-500 p-4 py-2"
            type="text"
            name="site"
            disabled={vaultMode !== 'unlocked'}
          />
          <div className="flex w-full flex-col justify-between gap-2 md:flex-row md:gap-8">
            <input
              value={form.userName}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full rounded-full border border-green-500 p-4 py-2"
              type="text"
              name="userName"
              disabled={vaultMode !== 'unlocked'}
            />
            <div className="relative w-full">
              <input
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-full border border-green-500 p-4 py-2 pr-20"
                type={showFormPassword ? 'text' : 'password'}
                name="password"
                disabled={vaultMode !== 'unlocked'}
              />
              <button
                type="button"
                className="absolute right-3 top-[6px] rounded-full px-3 py-1 text-sm font-medium text-green-700"
                onClick={() => setShowFormPassword((currentValue) => !currentValue)}
                disabled={vaultMode !== 'unlocked'}
              >
                {showFormPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={savePassword}
            disabled={isSubmitting || vaultMode !== 'unlocked'}
            className="w-fit rounded-full border border-green-900 bg-green-400 p-2 px-5 font-semibold hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editingId ? 'Update Password' : 'Add Password'}
          </button>
        </div>
      </div>

      <div className="mx-auto w-[90%] pb-8">
        <h2 className="py-4 text-2xl font-bold">Your Passwords</h2>
        {vaultMode !== 'unlocked' && (
          <div className="rounded-xl border border-dashed border-green-500 bg-white/60 p-4 text-slate-700">
            Unlock the vault to view saved passwords.
          </div>
        )}
        {vaultMode === 'unlocked' && passwordArray.length === 0 && <div>No passwords saved yet.</div>}
        {vaultMode === 'unlocked' && passwordArray.length !== 0 && (
          <div className="overflow-x-auto rounded-md">
            <table className="table-auto w-full overflow-hidden rounded-md">
              <thead className="bg-green-800 text-white">
                <tr>
                  <th className="py-2">Site</th>
                  <th className="py-2">Username</th>
                  <th className="py-2">Password</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="bg-green-100">
                {passwordArray.map((item) => {
                  const safeSiteUrl = getSafeSiteUrl(item.site);

                  return (
                    <tr key={item.id}>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2 px-2">
                          {safeSiteUrl ? (
                            <a
                              href={safeSiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-green-800 underline"
                            >
                              {item.site}
                            </a>
                          ) : (
                            <span className="truncate">{item.site}</span>
                          )}
                          <button
                            type="button"
                            className="rounded bg-transparent p-1"
                            onClick={() => copyText(item.site)}
                            aria-label="Copy site"
                          >
                            <img src="/icons/icons8-copy.gif" alt="Copy" className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2 px-2">
                          <span className="truncate">{item.userName}</span>
                          <button
                            type="button"
                            className="rounded bg-transparent p-1"
                            onClick={() => copyText(item.userName)}
                            aria-label="Copy username"
                          >
                            <img src="/icons/icons8-copy.gif" alt="Copy" className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2 px-2">
                          <span>{maskPassword(item.password)}</span>
                          <button
                            type="button"
                            className="rounded bg-transparent p-1"
                            onClick={() => copyText(item.password)}
                            aria-label="Copy password"
                          >
                            <img src="/icons/icons8-copy.gif" alt="Copy" className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-2 px-2">
                          <button
                            type="button"
                            onClick={() => editPassword(item.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePassword(item.id)}
                            className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default Manager;
