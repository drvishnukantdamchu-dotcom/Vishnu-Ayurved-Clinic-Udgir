import {allDemo,putDemo,deleteDemo} from './demo-store.mjs?v=28';
import {syncIntakes} from './intake-sync.mjs?v=28';
import {todayIST,validatePatient,searchPatients} from './patient-model.mjs?v=28';
import './clinical.mjs?v=28';
import './prescription.mjs?v=28';
import './panchakarma.mjs?v=28';
import './followup.mjs?v=28';
import './reports.mjs?v=28';
import './documents.mjs?v=28';
import './review.mjs?v=28';
import './backup.mjs?v=28';
import {getAuthProvider} from './auth-context.mjs?v=28';
const section=document.getElementById('patients');
document.querySelector('label[for="search"]').textContent='Name, Patient ID, village or mobile';
const panel=document.createElement('details');panel.className='panel';
panel.innerHTML=`<summary>＋ Register a new sample patient</summary><p class="notice">Fictional information only. Sign in before registration. Intake is saved on this device first and retried when you reconnect or sign in with the same account. Examination sync requires Save. Prescriptions require Owner / Doctor. Panchakarma and files remain local.</p>
<form id="registration"><div class="form-grid">
<label>Full name *<input name="name" required maxlength="100" autocomplete="off" placeholder="Sample patient D"></label>
<label>Age (years)<input name="age" type="number" min="0" max="120" step="1"></label>
<label>Gender<select name="gender"><option value="नोंद नाही">Not recorded</option><option value="स्त्री">Female</option><option value="पुरुष">Male</option><option value="इतर">Other</option></select></label>
<label>Village<input name="village" maxlength="100"></label>
<label>Mobile — optional<input name="mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="off"></label>
<label>Original visit date *<input name="visitDate" type="date" required></label></div>
<label><input name="demo" type="checkbox" required style="width:auto"> This is a fictional test record.</label>
<button type="submit">Add sample patient intake</button><p id="registration-status" role="status"></p></form><div class="cloud-tools"><button id="cloud-sync" type="button" disabled>Firebase sample sync</button><p id="cloud-status" role="status">Sign in to sync sample intake.</p></div>`;
section.prepend(panel);
const form=panel.querySelector('form'),date=form.elements.visitDate;date.value=todayIST();date.max=todayIST();
const cloudButton=panel.querySelector('#cloud-sync'),cloudStatus=panel.querySelector('#cloud-status');
const filters=document.createElement('div');filters.className='form-grid';filters.innerHTML='<label>From date<input id="date-from" type="date"></label><label>To date<input id="date-to" type="date"></label>';
document.getElementById('search').after(filters);
const list=[];const results=document.getElementById('results');
document.addEventListener('opd-samples-ready',e=>{for(const p of e.detail)if(!list.some(x=>x.id===p.id))list.push(p);update()});
function update(){const from=document.getElementById('date-from').value,to=document.getElementById('date-to').value;if(from&&to&&from>to){results.textContent='The start date must be before the end date.';return}document.dispatchEvent(new CustomEvent('opd-filtered',{detail:searchPatients(list,document.getElementById('search').value,from,to)}))}
for(const id of ['search','date-from','date-to'])document.getElementById(id).addEventListener('input',update);
let syncing=false,syncAgain=false,authEpoch=0;
function upsert(p){const i=list.findIndex(x=>x.id===p.id);if(i<0)list.push(p);else list[i]=p;document.dispatchEvent(new CustomEvent('opd-added',{detail:p}));}
async function syncCloud(){
 if(syncing){syncAgain=true;return}
 const auth=getAuthProvider(),user=auth?.current(),epoch=authEpoch;
 if(!user){cloudStatus.textContent='Sign in with the same account to sync pending records.';cloudButton.disabled=true;return}
 syncing=true;cloudButton.disabled=true;cloudStatus.textContent='Checking pending records and Firebase…';
 try{
  const result=await syncIntakes({auth,pending:async()=> (await allDemo('intake')).map(r=>r.value),remove:id=>deleteDemo('intake',id),onSaved:p=>upsert({...p,_cloudPending:false}),isCurrent:()=>epoch===authEpoch});
  const pending=(await allDemo('intake')).map(r=>r.value).filter(p=>p.createdBy===user.uid);
  if(epoch!==authEpoch||auth.current()?.uid!==user.uid)return;
  const ids=new Set(pending.map(p=>p.id));
  for(const p of result.remote)if(!ids.has(p.id))upsert(p);
  for(const p of pending)upsert({...p,_cloudPending:true});
  update();
  const codes=[...new Set(result.failures.map(f=>String(f.code).replace(/[^A-Za-z0-9_]/g,'')))].join(', ');
  cloudStatus.textContent=`Cloud: ${result.remote.length} records fetched · ${result.uploaded} uploaded · ${pending.length} pending.`+(codes?` Reason: ${codes}. Pending records are saved on this device.`:'');
 }catch(error){
  if(epoch===authEpoch){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();cloudStatus.textContent=`Cloud sync failed · ${code}. Unsent records are saved on this device. Try syncing again.`;}
 }finally{
  syncing=false;cloudButton.disabled=!getAuthProvider()?.current();
  if(syncAgain){syncAgain=false;queueMicrotask(syncCloud)}
 }
}
cloudButton.addEventListener('click',syncCloud);
window.addEventListener('online',()=>{if(getAuthProvider()?.current())syncCloud()});
window.addEventListener('opd-auth-change',async e=>{
 const epoch=++authEpoch;cloudButton.disabled=!e.detail;
 if(!e.detail){cloudStatus.textContent='Sign in to sync pending records.';return}
 try{
  const rows=await allDemo('intake');if(epoch!==authEpoch)return;
  for(const row of rows)if(row.value.createdBy===e.detail.uid)upsert({...row.value,_cloudPending:true});
  update();await syncCloud();
 }catch{cloudStatus.textContent='Could not open local storage. Check browser storage permissions.'}
});
form.addEventListener('submit',async e=>{e.preventDefault();const p=Object.fromEntries(new FormData(form));for(const k of ['name','mobile','village'])p[k]=p[k].trim();const error=validatePatient(p);const status=document.getElementById('registration-status');if(error){status.textContent=error;return}
 const user=getAuthProvider()?.current();if(!user){status.textContent='Sign in through Settings before registering a new record.';return}
 const duplicate=list.find(x=>x.name===p.name&&x.mobile===p.mobile&&x.village===p.village);if(duplicate){status.textContent=`A matching sample record already exists: ${duplicate.id}`;return}
 p.id='VAC-DEMO-'+crypto.randomUUID();p.type='नवीन';p.enteredAt=new Date().toISOString();p.createdAt=p.enteredAt;p.createdBy=user.uid;p._cloudPending=true;
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{await putDemo('intake',p.id,p);if(getAuthProvider()?.current()?.uid!==user.uid)return;upsert(p);status.textContent=`Record saved on this device: ${p.id}. See cloud status below.`;form.reset();date.value=todayIST();update();await syncCloud();}
 catch{status.textContent='Record save failed. Check browser storage. Your entries remain in the form.'}
 finally{submit.disabled=false}
});
document.dispatchEvent(new Event('opd-request-samples'));
