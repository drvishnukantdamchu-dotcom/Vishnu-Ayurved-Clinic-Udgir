// Phase 2 adapter. Tokens are held in memory only; no clinical data is loaded.
export function acceptedRole(document) {
  const f = document?.fields;
  if (f?.active?.booleanValue !== true) return null;
  const role = f?.role?.stringValue;
  return ['owner', 'student', 'doctor'].includes(role) ? role : null;
}
export function permissions(role) {
  return Object.freeze({
    enterDraft: ['owner', 'student', 'doctor'].includes(role),
    approveClinical: ['owner', 'doctor'].includes(role),
    manageUsers: role === 'owner',
    exportAll: role === 'owner',
    restoreBackup: role === 'owner'
  });
}
export function createAuth(config, request = fetch) {
  let session = null;
  let generation = 0;
  const configured = Boolean(config?.enabled === true && config?.apiKey && config?.projectId);
  async function json(url, options) {
    const response = await request(url, {...options, cache: 'no-store', signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('AUTH_FAILED');
    return response.json();
  }
  return {
    configured,
    logout() { generation++; session = null; },
    current() {
      if (session && Date.now() >= session.expiresAt) session = null;
      return session ? {uid: session.uid, role: session.role} : null;
    },
    async login(email, password) {
      session = null;
      const attempt = ++generation;
      if (!configured) throw new Error('NOT_CONFIGURED');
      const auth = await json(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email.trim(), password, returnSecureToken: true})
      });
      if (!auth.localId || !auth.idToken) throw new Error('AUTH_FAILED');
      const record = await json(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/${encodeURIComponent(auth.localId)}`, {
        headers: {Authorization: `Bearer ${auth.idToken}`}
      });
      const role = acceptedRole(record);
      if (!role || attempt !== generation) throw new Error('ACCESS_DENIED');
      // Never use the typed email to grant ownership. Server-controlled UID record only.
      session = {uid: auth.localId, role, expiresAt: Date.now() + 15 * 60 * 1000};
      return {uid: session.uid, role: session.role};
    }
  };
}
