import {allDemo,putDemo,deleteDemo} from './demo-store.mjs?v=25';
import {syncIntakes} from './intake-sync.mjs?v=25';
import {todayIST,validatePatient,searchPatients} from './patient-model.mjs';
import './clinical.mjs?v=25';
import './prescription.mjs?v=25';
import './panchakarma.mjs?v=25';
import './followup.mjs?v=25';
import './reports.mjs?v=25';
import './documents.mjs?v=25';
import './review.mjs?v=25';
import './backup.mjs?v=25';
import {getAuthProvider} from './auth-context.mjs?v=25';
const section=document.getElementById('patients');
document.querySelector('label[for="search"]').textContent='नाव, Patient ID, गाव किंवा मोबाइल';
const panel=document.createElement('details');panel.className='panel';
panel.innerHTML=`<summary>＋ नवीन नमुना रुग्ण नोंदवा</summary><p class="notice">फक्त काल्पनिक माहिती वापरा. Login व Firestore नियम सक्रिय असल्यास नाव/संपर्क/भेट तारीख सुरक्षित rules अंतर्गत Firebase patient intakeमध्ये जतन होईल; नवीन नोंद करण्याआधी login करा. नोंद आधी या डिव्हाइसवर जतन होते; इंटरनेट परत आल्यावर किंवा पुन्हा login केल्यावर त्याच वापरकर्त्याच्या प्रलंबित नोंदी पुन्हा sync केल्या जातात. काल्पनिक तपासणी save केल्यास Firebaseमध्ये sync होते; प्रिस्क्रिप्शन फक्त Owner/Doctorसाठी. पंचकर्म व फाइल्स या डिव्हाइसवरच राहतात.</p>
<form id="registration"><div class="form-grid">
<label>पूर्ण नाव *<input name="name" required maxlength="100" autocomplete="off" placeholder="नमुना रुग्ण ड"></label>
<label>वय (वर्षे)<input name="age" type="number" min="0" max="120" step="1"></label>
<label>लिंग<select name="gender"><option>नोंद नाही</option><option>स्त्री</option><option>पुरुष</option><option>इतर</option></select></label>
<label>गाव<input name="village" maxlength="100"></label>
<label>मोबाइल — ऐच्छिक<input name="mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="off"></label>
<label>मूळ भेटीची तारीख *<input name="visitDate" type="date" required></label></div>
<label><input name="demo" type="checkbox" required style="width:auto"> ही काल्पनिक चाचणी नोंद आहे.</label>
<button type="submit">नमुना patient intake जोडा</button><p id="registration-status" role="status"></p></form><div class="cloud-tools"><button id="cloud-sync" type="button" disabled>Firebase sample sync</button><p id="cloud-status" role="status">Firebase login केल्यावर नमुना intake sync करता येईल.</p></div>`;
section.prepend(panel);
const form=panel.querySelector('form'),date=form.elements.visitDate;date.value=todayIST();date.max=todayIST();
const cloudButton=panel.querySelector('#cloud-sync'),cloudStatus=panel.querySelector('#cloud-status');
const filters=document.createElement('div');filters.className='form-grid';filters.innerHTML='<label>तारखेपासून<input id="date-from" type="date"></label><label>तारखेपर्यंत<input id="date-to" type="date"></label>';
document.getElementById('search').after(filters);
const list=[];const results=document.getElementById('results');
document.addEventListener('opd-samples-ready',e=>{for(const p of e.detail)if(!list.some(x=>x.id===p.id))list.push(p);update()});
function update(){const from=document.getElementById('date-from').value,to=document.getElementById('date-to').value;if(from&&to&&from>to){results.textContent='सुरुवातीची तारीख शेवटच्या तारखेपूर्वी असावी.';return}document.dispatchEvent(new CustomEvent('opd-filtered',{detail:searchPatients(list,document.getElementById('search').value,from,to)}))}
for(const id of ['search','date-from','date-to'])document.getElementById(id).addEventListener('input',update);
let syncing=false,syncAgain=false,authEpoch=0;
function upsert(p){const i=list.findIndex(x=>x.id===p.id);if(i<0)list.push(p);else list[i]=p;document.dispatchEvent(new CustomEvent('opd-added',{detail:p}));}
async function syncCloud(){
 if(syncing){syncAgain=true;return}
 const auth=getAuthProvider(),user=auth?.current(),epoch=authEpoch;
 if(!user){cloudStatus.textContent='प्रलंबित नोंदींसाठी त्याच खात्याने Firebase login करा.';cloudButton.disabled=true;return}
 syncing=true;cloudButton.disabled=true;cloudStatus.textContent='प्रलंबित नोंदी व Firebase तपासत आहे…';
 try{
  const result=await syncIntakes({auth,pending:async()=> (await allDemo('intake')).map(r=>r.value),remove:id=>deleteDemo('intake',id),onSaved:p=>upsert({...p,_cloudPending:false}),isCurrent:()=>epoch===authEpoch});
  const pending=(await allDemo('intake')).map(r=>r.value).filter(p=>p.createdBy===user.uid);
  if(epoch!==authEpoch||auth.current()?.uid!==user.uid)return;
  const ids=new Set(pending.map(p=>p.id));
  for(const p of result.remote)if(!ids.has(p.id))upsert(p);
  for(const p of pending)upsert({...p,_cloudPending:true});
  update();
  const codes=[...new Set(result.failures.map(f=>String(f.code).replace(/[^A-Za-z0-9_]/g,'')))].join(', ');
  cloudStatus.textContent=`Cloud: ${result.remote.length} नोंदी मिळाल्या · ${result.uploaded} पाठवल्या · ${pending.length} प्रलंबित.`+(codes?` कारण: ${codes}. प्रलंबित नोंदी या डिव्हाइसवर जतन आहेत.`:'');
 }catch(error){
  if(epoch===authEpoch){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();cloudStatus.textContent=`Cloud sync अयशस्वी · ${code}. न पाठवलेल्या नोंदी या डिव्हाइसवर जतन आहेत; पुन्हा sync करा.`;}
 }finally{
  syncing=false;cloudButton.disabled=!getAuthProvider()?.current();
  if(syncAgain){syncAgain=false;queueMicrotask(syncCloud)}
 }
}
cloudButton.addEventListener('click',syncCloud);
window.addEventListener('online',()=>{if(getAuthProvider()?.current())syncCloud()});
window.addEventListener('opd-auth-change',async e=>{
 const epoch=++authEpoch;cloudButton.disabled=!e.detail;
 if(!e.detail){cloudStatus.textContent='Firebase login केल्यावर प्रलंबित नोंदी sync होतील.';return}
 try{
  const rows=await allDemo('intake');if(epoch!==authEpoch)return;
  for(const row of rows)if(row.value.createdBy===e.detail.uid)upsert({...row.value,_cloudPending:true});
  update();await syncCloud();
 }catch{cloudStatus.textContent='स्थानिक साठवण उघडली नाही. ब्राउझरची storage परवानगी तपासा.'}
});
form.addEventListener('submit',async e=>{e.preventDefault();const p=Object.fromEntries(new FormData(form));for(const k of ['name','mobile','village'])p[k]=p[k].trim();const error=validatePatient(p);const status=document.getElementById('registration-status');if(error){status.textContent=error;return}
 const user=getAuthProvider()?.current();if(!user){status.textContent='नवीन नोंद करण्याआधी Settingsमधून Firebase login करा.';return}
 const duplicate=list.find(x=>x.name===p.name&&x.mobile===p.mobile&&x.village===p.village);if(duplicate){status.textContent=`अशी नमुना नोंद आधीच आहे: ${duplicate.id}`;return}
 p.id='VAC-DEMO-'+crypto.randomUUID();p.type='नवीन';p.enteredAt=new Date().toISOString();p.createdAt=p.enteredAt;p.createdBy=user.uid;p._cloudPending=true;
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{await putDemo('intake',p.id,p);if(getAuthProvider()?.current()?.uid!==user.uid)return;upsert(p);status.textContent=`नोंद या डिव्हाइसवर जतन झाली: ${p.id}. Cloud स्थिती खाली पहा.`;form.reset();date.value=todayIST();update();await syncCloud();}
 catch{status.textContent='नोंद जतन झाली नाही. ब्राउझर साठवण तपासा; भरलेली माहिती फॉर्ममध्ये ठेवली आहे.'}
 finally{submit.disabled=false}
});
document.dispatchEvent(new Event('opd-request-samples'));
