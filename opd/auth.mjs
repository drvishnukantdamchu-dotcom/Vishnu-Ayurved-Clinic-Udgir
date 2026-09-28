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
  async function validToken() {
    if (!session || Date.now() >= session.expiresAt) { session=null; throw new Error('SESSION_EXPIRED'); }
    if (Date.now() + 60000 < session.tokenExpiresAt) return session.idToken;
    const refreshed=await json(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken})
    });
    if(!refreshed.id_token)throw new Error('SESSION_EXPIRED');
    session.idToken=refreshed.id_token;session.refreshToken=refreshed.refresh_token||session.refreshToken;
    session.tokenExpiresAt=Date.now()+Number(refreshed.expires_in||3600)*1000;
    return session.idToken;
  }
  function firestorePath(path) {
    const documents=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents`;
    if(path==='patientIntakes:runQuery')return `${documents}:runQuery`;
    if(/^patientIntakes\/[A-Za-z0-9_-]{1,150}$/.test(path))return `${documents}/${path}`;
    throw new Error('PATH_DENIED');
  }
  async function firestore(path,{method='GET',body}={}) {
    const token=await validToken();
    return json(firestorePath(path),{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  }
  function toValue(value){
    if(value===null)return {nullValue:null};
    if(typeof value==='string')return {stringValue:value};
    if(typeof value==='boolean')return {booleanValue:value};
    if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
    if(Array.isArray(value))return {arrayValue:{values:value.map(toValue)}};
    if(typeof value==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,toValue(v)]))}};
    throw new Error('VALUE_DENIED');
  }
  function fromValue(value){
    if('stringValue'in value)return value.stringValue;
    if('integerValue'in value)return Number(value.integerValue);
    if('doubleValue'in value)return value.doubleValue;
    if('booleanValue'in value)return value.booleanValue;
    if('nullValue'in value)return null;
    if('timestampValue'in value)return value.timestampValue;
    if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,fromValue(v)]));
    if('arrayValue'in value)return (value.arrayValue.values||[]).map(fromValue);
    return null;
  }
  return {
    configured,
    logout() { generation++; session = null; },
    current() {
      if (session && Date.now() >= session.expiresAt) session = null;
      return session ? {uid: session.uid, role: session.role} : null;
    },
    async listPatientIntakes(){
      if(!session)throw new Error('SESSION_EXPIRED');
      const query={structuredQuery:{from:[{collectionId:'patientIntakes'}],limit:100}};
      if(session.role==='student')query.structuredQuery.where={fieldFilter:{field:{fieldPath:'createdBy'},op:'EQUAL',value:{stringValue:session.uid}}};
      const rows=await firestore('patientIntakes:runQuery',{method:'POST',body:query});
      return rows.filter(row=>row.document).map(row=>{const d=row.document;return {...Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,fromValue(v)])),id:d.name.split('/').at(-1)}});
    },
    async savePatientIntake(record){
      if(!session)throw new Error('SESSION_EXPIRED');
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(record?.id)||!record?.name)throw new Error('SYNTHETIC_ONLY');
      const now=new Date().toISOString();
      const intake={id:record.id,createdBy:String(record.createdBy||session.uid),name:String(record.name).slice(0,100),age:String(record.age||''),gender:String(record.gender||''),village:String(record.village||'').slice(0,100),mobile:String(record.mobile||''),visitDate:String(record.visitDate||''),type:String(record.type||'नवीन'),enteredAt:String(record.enteredAt||now),createdAt:String(record.createdAt||now),updatedAt:now};
      const fields=Object.fromEntries(Object.entries(intake).map(([k,v])=>[k,toValue(v)]));
      const result=await firestore(`patientIntakes/${encodeURIComponent(record.id)}`,{method:'PATCH',body:{fields}});
      return {...intake,id:result.name?.split('/').at(-1)||intake.id};
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
      const now=Date.now();
      session = {uid: auth.localId, role, idToken:auth.idToken,refreshToken:auth.refreshToken,tokenExpiresAt:now+Number(auth.expiresIn||3600)*1000,expiresAt:now+15*60*1000};
      return {uid: session.uid, role: session.role};
    }
  };
}
