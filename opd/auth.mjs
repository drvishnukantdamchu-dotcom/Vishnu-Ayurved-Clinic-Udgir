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
export function firebaseErrorMessage(error) {
  const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();
  const messages={
    INVALID_LOGIN_CREDENTIALS:'Email or password does not match. Check the Email/Password provider in Firebase Authentication.',
    EMAIL_NOT_FOUND:'Firestore document not found. Check users/{Auth UID} during sign-in.',
    INVALID_PASSWORD:'Incorrect password.',
    OPERATION_NOT_ALLOWED:'Email/Password sign-in is disabled in Firebase Authentication.',
    API_KEY_INVALID:'Invalid Firebase API key. Check firebase-config.json.',
    INVALID_API_KEY:'Invalid Firebase API key. Check firebase-config.json.',
    PERMISSION_DENIED:'Firestore Rules denied the request. Check UID, users/{UID} role and the collection rule.',
    ACCESS_DENIED:'Check users/{Auth UID}: active=true and role=owner, doctor or student.',
    NOT_FOUND:'Firestore document not found. Check users/{Auth UID} during sign-in.',
    RESOURCE_EXHAUSTED:'Firebase quota or rate limit reached.',
    NETWORK_ERROR:'Cannot connect to Firebase. Check internet, VPN, ad blockers or Google API network restrictions. Do not change Firestore Rules.',
    REQUEST_TIMEOUT:'Firebase did not respond within 15 seconds. Check connectivity and try again.',
    SESSION_EXPIRED:'Session expired. Sign in again.',
    NOT_CONFIGURED:'Firebase configuration is unavailable or disabled.'
  };
  if(messages[code])return `${messages[code]} [${code}]`;
  if(code.startsWith('HTTP_403'))return `${messages.PERMISSION_DENIED} [${code}]`;
  if(code.startsWith('HTTP_404'))return `${messages.NOT_FOUND} [${code}]`;
  if(code.startsWith('HTTP_401'))return `${messages.SESSION_EXPIRED} [${code}]`;
  return `Firebase error code: ${code||'UNKNOWN_ERROR'}. [${code||'UNKNOWN_ERROR'}]`;
}
function authError(code){const e=new Error(code);e.code=code;return e}
function isMissingDocument(error){return error?.code==='NOT_FOUND'||error?.code==='HTTP_404'}
export function createAuth(config, request = fetch) {
  let session = null;
  let generation = 0;
  const configured = Boolean(config?.enabled === true && config?.apiKey && config?.projectId);
  async function json(url, options) {
    let response;
    // AbortSignal.timeout is absent in older mobile browsers. Use the widely
    // supported controller so a local compatibility error is not called a
    // Firebase network failure. Never retry writes automatically here.
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try { response=await request(url,{...options,cache:'no-store',signal:controller.signal}); }
    catch { throw authError(controller.signal.aborted?'REQUEST_TIMEOUT':'NETWORK_ERROR'); }
    finally { clearTimeout(timer); }
    let payload=null;
    try { payload=await response.json(); } catch {}
    if (!response.ok) {
      const firebaseCode=String(payload?.error?.status||payload?.error?.message||'').split(/[ :]/)[0].replace(/[^A-Za-z0-9_]/g,'').toUpperCase();
      throw authError(firebaseCode||`HTTP_${response.status}`);
    }
    if(payload===null)throw authError('INVALID_RESPONSE');
    return payload;
  }
  async function validToken() {
    if (!session || Date.now() >= session.expiresAt) { session=null; throw authError('SESSION_EXPIRED'); }
    if (Date.now() + 60000 < session.tokenExpiresAt) return session.idToken;
    const refreshed=await json(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken})
    });
    if(!refreshed.id_token)throw authError('SESSION_EXPIRED');
    session.idToken=refreshed.id_token;session.refreshToken=refreshed.refresh_token||session.refreshToken;
    session.tokenExpiresAt=Date.now()+Number(refreshed.expires_in||3600)*1000;
    return session.idToken;
  }
  function firestorePath(path) {
    const documents=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents`;
    if(/^users\/[A-Za-z0-9_-]{1,128}$/.test(path))return `${documents}/${path}`;
    if(path==='clinicRecords:runQuery')return `${documents}:runQuery`;
    if(path==='clinicRecords')return `${documents}/clinicRecords`;
    if(/^clinicRecords\/(intake|clinical|prescription|panchakarma|followup|review)_VAC-OPD-[A-Za-z0-9_-]{1,140}$/.test(path))return `${documents}/${path}`;
    if(path==='patientIntakes:runQuery')return `${documents}:runQuery`;
    if(/^demoClinical\/VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(path))return `${documents}/${path}`;
    if(/^demoPrescriptions\/VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(path))return `${documents}/${path}`;
    if(/^patientIntakes\/[A-Za-z0-9_-]{1,150}$/.test(path))return `${documents}/${path}`;
    throw new Error('PATH_DENIED');
  }
  async function firestore(path,{method='GET',body,createOnly=false,revision='',pageToken=''}={}) {
    const attempt=generation;
    const token=await validToken();
    if(attempt!==generation)throw authError('SESSION_CHANGED');
    const params=new URLSearchParams();if(createOnly)params.set('currentDocument.exists','false');if(revision)params.set('currentDocument.updateTime',revision);if(path==='clinicRecords'){params.set('pageSize','100');if(pageToken)params.set('pageToken',pageToken)}
    return json(firestorePath(path)+(params.size?'?'+params:''),{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
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
    async openDevice(savedRefreshToken){
      session=null;const attempt=++generation;
      if(!configured)throw authError('NOT_CONFIGURED');
      const a=savedRefreshToken?await json(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:savedRefreshToken})}):await json(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(config.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true})});
      if(attempt!==generation)throw authError('SESSION_CHANGED');
      const uid=a.localId||a.user_id,token=a.idToken||a.id_token,refresh=a.refreshToken||a.refresh_token;
      if(!uid||!token||!refresh)throw authError('AUTH_FAILED');
      const now=Date.now();session={uid,role:'pending',idToken:token,refreshToken:refresh,tokenExpiresAt:now+Number(a.expiresIn||a.expires_in||3600)*1000,expiresAt:now+12*60*60*1000};
      await this.checkDevice();return {uid,refreshToken:refresh,role:session.role};
    },
    async checkDevice(){
      if(!session)throw authError('SESSION_EXPIRED');
      let record;try{record=await firestore(`users/${session.uid}`)}catch(e){if(!isMissingDocument(e))throw e;}
      session.role=acceptedRole(record)==='student'?'student':'pending';return this.current();
    },
    async setStudentDevice(uid,active){
      if(session?.role!=='owner')throw authError('ROLE_DENIED');
      if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||uid===session.uid)throw authError('INVALID_DEVICE');
      await firestore(`users/${uid}`,{method:'PATCH',body:{fields:{role:{stringValue:'student'},active:{booleanValue:active===true},displayName:{stringValue:'Clinic entry device'}}}});
    },
    async listClinicRecords(){
      if(!['owner','doctor','student'].includes(session?.role))throw authError('ROLE_DENIED');
      if(session.role==='student'){const records=[];for(const kind of ['intake','clinical']){const rows=await firestore('clinicRecords:runQuery',{method:'POST',body:{structuredQuery:{from:[{collectionId:'clinicRecords'}],where:{compositeFilter:{op:'AND',filters:[{fieldFilter:{field:{fieldPath:'createdBy'},op:'EQUAL',value:{stringValue:session.uid}}},{fieldFilter:{field:{fieldPath:'kind'},op:'EQUAL',value:{stringValue:kind}}}]}}}}});for(const row of rows)if(row.document){const doc=row.document;records.push({...Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,fromValue(v)])),revision:doc.updateTime})}}return records;}
      const records=[];let pageToken='';
      do{const page=await firestore('clinicRecords',{pageToken});for(const doc of page.documents||[])records.push({...Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,fromValue(v)])),revision:doc.updateTime});pageToken=page.nextPageToken||'';}while(pageToken);
      return records;
    },
    async saveClinicRecord(row){
      if(!['owner','doctor','student'].includes(session?.role)||session.role==='student'&&!['intake','clinical'].includes(row.kind))throw authError('ROLE_DENIED');
      if(!['intake','clinical','prescription','panchakarma','followup','review'].includes(row.kind)||!/^VAC-OPD-[A-Za-z0-9_-]{1,140}$/.test(row.id))throw authError('INVALID_RECORD');
      const payload=JSON.stringify(row.value??null);if(new TextEncoder().encode(payload).length>800000)throw authError('RECORD_TOO_LARGE');
      const data={id:row.id,kind:row.kind,payload,deleted:row.deleted===true,createdBy:row.cloudAuthor||session.uid,updatedBy:session.uid,updatedAt:row.updatedAt};
      const fields=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,toValue(v)]));
      const result=await firestore(`clinicRecords/${row.kind}_${row.id}`,{method:'PATCH',body:{fields},createOnly:!row.cloudRevision,revision:row.cloudRevision||''});
      return {...data,revision:result.updateTime};
    },
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
    async savePatientIntake(record,{createOnly=false}={}){
      if(!session)throw new Error('SESSION_EXPIRED');
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(record?.id)||!record?.name)throw new Error('SYNTHETIC_ONLY');
      const now=new Date().toISOString();
      const intake={id:record.id,createdBy:String(record.createdBy||session.uid),name:String(record.name).slice(0,100),age:String(record.age||''),gender:String(record.gender||''),village:String(record.village||'').slice(0,100),mobile:String(record.mobile||''),visitDate:String(record.visitDate||''),type:String(record.type||'नवीन'),enteredAt:String(record.enteredAt||now),createdAt:String(record.createdAt||now),updatedAt:now};
      const fields=Object.fromEntries(Object.entries(intake).map(([k,v])=>[k,toValue(v)]));
      let result;
      try {result=await firestore(`patientIntakes/${encodeURIComponent(record.id)}`,{method:'PATCH',body:{fields},createOnly});}
      catch(error){
        if(!createOnly||!['ALREADY_EXISTS','FAILED_PRECONDITION'].includes(error.code))throw error;
        // An acknowledged write may have lost its response. Read it back; never
        // overwrite a newer cloud record while retrying the same intake ID.
        const existing=await firestore(`patientIntakes/${encodeURIComponent(record.id)}`);
        const saved=Object.fromEntries(Object.entries(existing.fields||{}).map(([k,v])=>[k,fromValue(v)]));
        if(saved.id!==record.id||saved.createdBy!==intake.createdBy)throw authError('RECORD_CONFLICT');
        return saved;
      }
      return {...intake,id:result.name?.split('/').at(-1)||intake.id};
    },
    async loadDemoClinical(id){
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(id))throw new Error('SYNTHETIC_ONLY');
      const row=await firestore(`demoClinical/${id}`);
      const data=Object.fromEntries(Object.entries(row.fields||{}).map(([k,v])=>[k,fromValue(v)]));
      if(data.id!==id||!data.payload||!Array.isArray(data.payload.complaints))throw new Error('INVALID_RECORD');
      return data;
    },
    async saveDemoClinical(id,payload){
      if(!session)throw new Error('SESSION_EXPIRED');
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(id)||!Array.isArray(payload?.complaints)||typeof payload?.values!=='object')throw new Error('SYNTHETIC_ONLY');
      if(payload.complaints.length>10||JSON.stringify(payload).length>25000)throw new Error('RECORD_TOO_LARGE');
      // Students write under their own UID without a preliminary GET. A GET of a
      // missing document is denied by the student read rule, so read-before-write
      // would block legitimate creates. Update rules still prevent editing others.
      let author=session.uid;
      if(session.role!=='student'){
        try{const prior=await this.loadDemoClinical(id);author=prior.createdBy}
        catch(error){if(!isMissingDocument(error))throw error}
      }
      const record={id,createdBy:author,payload,updatedAt:new Date().toISOString()};
      const fields=Object.fromEntries(Object.entries(record).map(([k,v])=>[k,toValue(v)]));
      await firestore(`demoClinical/${id}`,{method:'PATCH',body:{fields}});
      return record;
    },
    async loadDemoPrescription(id){
      if(!session)throw new Error('SESSION_EXPIRED');
      if(!['owner','doctor'].includes(session.role))throw new Error('ROLE_DENIED');
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(id))throw new Error('SYNTHETIC_ONLY');
      const row=await firestore(`demoPrescriptions/${id}`);
      const data=Object.fromEntries(Object.entries(row.fields||{}).map(([k,v])=>[k,fromValue(v)]));
      if(data.id!==id||!data.payload||!Array.isArray(data.payload.drugs))throw new Error('INVALID_RECORD');
      return data;
    },
    async saveDemoPrescription(id,payload){
      if(!session)throw new Error('SESSION_EXPIRED');
      if(!['owner','doctor'].includes(session.role))throw new Error('ROLE_DENIED');
      if(!/^VAC-DEMO-[A-Za-z0-9_-]{1,140}$/.test(id)||!Array.isArray(payload?.drugs)||typeof payload?.diagnosis!=='string'||typeof payload?.advice!=='string'||typeof payload?.followup!=='string')throw new Error('SYNTHETIC_ONLY');
      if(payload.drugs.length>20||JSON.stringify(payload).length>40000)throw new Error('RECORD_TOO_LARGE');
      let author=session.uid;
      try{const prior=await this.loadDemoPrescription(id);author=prior.createdBy}
      catch(error){if(!isMissingDocument(error))throw error}
      const record={id,createdBy:author,updatedBy:session.uid,payload,updatedAt:new Date().toISOString()};
      const fields=Object.fromEntries(Object.entries(record).map(([k,v])=>[k,toValue(v)]));
      await firestore(`demoPrescriptions/${id}`,{method:'PATCH',body:{fields}});
      return record;
    },
    async login(email, password) {
      session = null;
      const attempt = ++generation;
      if (!configured) throw new Error('NOT_CONFIGURED');
      const auth = await json(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email.trim(), password, returnSecureToken: true})
      });
      if (!auth.localId || !auth.idToken) throw authError('AUTH_FAILED');
      const record = await json(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/${encodeURIComponent(auth.localId)}`, {
        headers: {Authorization: `Bearer ${auth.idToken}`}
      });
      const role = acceptedRole(record);
      if (!role || attempt !== generation) throw authError('ACCESS_DENIED');
      // Never use the typed email to grant ownership. Server-controlled UID record only.
      const now=Date.now();
      session = {uid: auth.localId, role, idToken:auth.idToken,refreshToken:auth.refreshToken,tokenExpiresAt:now+Number(auth.expiresIn||3600)*1000,expiresAt:now+15*60*1000};
      return {uid: session.uid, role: session.role};
    }
  };
}
