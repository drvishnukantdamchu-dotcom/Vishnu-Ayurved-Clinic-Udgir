// Personal clinic records in a separate browser-local database. No cloud calls.
const NAME='vac-opd-clinic-v1';
const KINDS=new Set(['review','intake','clinical','prescription','panchakarma','attachment','followup']);
export function syntheticId(id){return /^VAC-OPD-[A-Za-z0-9_-]{1,140}$/.test(String(id||''))}

export function validateStoredRecord(kind,id,value){
 if(!KINDS.has(kind)||!syntheticId(id)||!value||typeof value!=='object')throw new Error('INVALID_BACKUP');
 if(kind==='intake'&&(value.id!==id||typeof value.name!=='string'||!value.name.trim()||value.name.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(value.visitDate||'')))throw new Error('INVALID_BACKUP');
 if(kind==='clinical'&&(!Array.isArray(value.complaints)||value.complaints.length>10||!value.values||typeof value.values!=='object'))throw new Error('INVALID_BACKUP');
 if(kind==='prescription'&&(!Array.isArray(value.drugs)||value.drugs.length>20||typeof value.diagnosis!=='string'||typeof value.advice!=='string'||typeof value.followup!=='string'))throw new Error('INVALID_BACKUP');
 if(kind==='review'&&(value.patient?.id!==id||!['pending','reviewed'].includes(value.status)||typeof value.submittedAt!=='string'||typeof value.note!=='string'))throw new Error('INVALID_BACKUP');
 if(kind==='followup'&&(value.patient?.id!==id||!/^\d{4}-\d{2}-\d{2}$/.test(value.date||'')||typeof value.done!=='boolean'))throw new Error('INVALID_BACKUP');
 if(['panchakarma','attachment'].includes(kind)&&!Array.isArray(value))throw new Error('INVALID_BACKUP');
 return true;
}

function open(){return new Promise((resolve,reject)=>{if(!globalThis.indexedDB){reject(new Error('STORAGE_UNAVAILABLE'));return}const request=indexedDB.open(NAME,1);request.onupgradeneeded=()=>{request.result.createObjectStore('records',{keyPath:'key'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function operation(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records',mode),store=tx.objectStore('records');let result;const request=action(store);request.onsuccess=()=>{result=request.result};request.onerror=()=>reject(request.error);tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}
function key(kind,id){if(!KINDS.has(kind)||!syntheticId(id))throw new Error('INVALID_RECORD_ID');return `${kind}:${id}`}
export async function getDemo(kind,id){const entry=await operation('readonly',s=>s.get(key(kind,id)));return entry?.deleted?null:entry?.value??null}
export async function putDemo(kind,id,value){
 const existing=await operation('readonly',s=>s.get(key(kind,id)));
 const result=await operation('readwrite',s=>s.put({...existing,key:key(kind,id),kind,id,value,deleted:false,dirty:true,updatedAt:new Date().toISOString()}));
 globalThis.dispatchEvent?.(new Event('opd-local-save'));return result;
}
export async function deleteDemo(kind,id){const existing=await operation('readonly',s=>s.get(key(kind,id)));if(!existing)return;await operation('readwrite',s=>s.put({...existing,value:null,deleted:true,dirty:true,updatedAt:new Date().toISOString()}));globalThis.dispatchEvent?.(new Event('opd-local-save'));}
export async function allDemo(kind){if(!KINDS.has(kind))throw new Error('KIND_DENIED');const rows=await operation('readonly',s=>s.getAll());return rows.filter(r=>r.kind===kind&&!r.deleted&&syntheticId(r.id))}
export async function exportDemo(){const rows=await operation('readonly',s=>s.getAll());return {format:'vac-opd-clinic-backup',version:1,exportedAt:new Date().toISOString(),records:await Promise.all(rows.filter(r=>KINDS.has(r.kind)&&!r.deleted&&syntheticId(r.id)).map(async r=>({...r,value:r.kind==='attachment'?await Promise.all(r.value.map(async item=>({...item,blob:await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(item.blob)} )}))):r.value})))} }
export async function importDemo(backup){if(backup?.format!=='vac-opd-clinic-backup'||backup.version!==1||!Array.isArray(backup.records)||backup.records.length>10000)throw new Error('INVALID_BACKUP');const safe=[];for(const row of backup.records){key(row.kind,row.id);if(row.key!==`${row.kind}:${row.id}`)throw new Error('INVALID_BACKUP');let value=row.value;validateStoredRecord(row.kind,row.id,value);if(row.kind==='attachment'){if(!Array.isArray(value)||value.length>20)throw new Error('INVALID_BACKUP');value=value.map(item=>{const match=/^data:(application\/pdf|image\/jpeg|image\/png);base64,([A-Za-z0-9+/=]+)$/.exec(item.blob||'');if(!match||match[2].length>7_000_000)throw new Error('INVALID_BACKUP');const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));return {...item,blob:new Blob([bytes],{type:match[1]})}})}safe.push({key:row.key,kind:row.kind,id:row.id,value,dirty:true,updatedAt:new Date().toISOString()})}const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');for(const row of safe)tx.objectStore('records').put(row);tx.oncomplete=()=>{db.close();resolve(safe.length)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(tx.error)}})}

export async function syncRows(){return (await operation('readonly',s=>s.getAll())).filter(r=>r.kind!=='attachment'&&syntheticId(r.id));}
export async function acceptCloud(row,expectedLocalTime=null){
 const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records'),k=key(row.kind,row.id);let accepted=false;const request=store.get(k);
 request.onsuccess=()=>{const old=request.result;if(expectedLocalTime!==null){if(old?.updatedAt!==expectedLocalTime)return;}else if(old?.dirty||old&&!old.cloudRevision)return;
 let value;try{value=JSON.parse(row.payload);if(!row.deleted)validateStoredRecord(row.kind,row.id,value);}catch{tx.abort();return;}
 store.put({key:k,kind:row.kind,id:row.id,value,deleted:row.deleted,dirty:false,updatedAt:row.updatedAt,cloudRevision:row.revision,cloudAuthor:row.createdBy});accepted=true;};
 request.onerror=()=>tx.abort();tx.oncomplete=()=>{db.close();resolve(accepted)};tx.onerror=()=>{db.close();reject(tx.error)};tx.onabort=()=>{db.close();reject(new Error('CLOUD_IMPORT_FAILED'))};});
}
