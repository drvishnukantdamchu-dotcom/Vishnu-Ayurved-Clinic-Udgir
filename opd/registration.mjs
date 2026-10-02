import {allDemo,putDemo} from './demo-store.mjs?v=34';
import {todayIST,validatePatient,searchPatients} from './patient-model.mjs?v=34';
import './clinical.mjs?v=34';
import './prescription.mjs?v=34';
import './panchakarma.mjs?v=34';
import './followup.mjs?v=34';
import './reports.mjs?v=34';
import './documents.mjs?v=34';
import './review.mjs?v=34';
import './backup.mjs?v=34';
import './record-management.mjs?v=34';
const section=document.getElementById('patients');
document.querySelector('label[for="search"]').textContent='Name, Patient ID, village or mobile';
const panel=document.createElement('details');panel.className='panel';
panel.innerHTML=`<summary>＋ Register a new patient</summary><p class="notice">Personal offline workspace. Records are saved in this browser on this device. Download regular backups. No Firebase connection or sign-in is required.</p>
<form id="registration"><div class="form-grid">
<label>Full name *<input name="name" required maxlength="100" autocomplete="off" placeholder="Patient full name"></label>
<label>Age (years)<input name="age" type="number" min="0" max="120" step="1"></label>
<label>Gender<select name="gender"><option value="नोंद नाही">Not recorded</option><option value="स्त्री">Female</option><option value="पुरुष">Male</option><option value="इतर">Other</option></select></label>
<label>Village<input name="village" maxlength="100"></label>
<label>Mobile — optional<input name="mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="off"></label>
<label>Original visit date *<input name="visitDate" type="date" required></label></div>

<button type="submit">Add patient intake</button><p id="registration-status" role="status"></p></form>`;
section.prepend(panel);
const form=panel.querySelector('form'),date=form.elements.visitDate;date.value=todayIST();date.max=todayIST();
const filters=document.createElement('div');filters.className='form-grid';filters.innerHTML='<label>From date<input id="date-from" type="date"></label><label>To date<input id="date-to" type="date"></label>';
document.getElementById('search').after(filters);
const list=[];const results=document.getElementById('results');
document.addEventListener('opd-samples-ready',e=>{for(const p of e.detail)if(!list.some(x=>x.id===p.id))list.push(p);update()});
function update(){const from=document.getElementById('date-from').value,to=document.getElementById('date-to').value;if(from&&to&&from>to){results.textContent='The start date must be before the end date.';return}document.dispatchEvent(new CustomEvent('opd-filtered',{detail:searchPatients(list,document.getElementById('search').value,from,to)}))}
for(const id of ['search','date-from','date-to'])document.getElementById(id).addEventListener('input',update);
function upsert(p){const i=list.findIndex(x=>x.id===p.id);if(i<0)list.push(p);else list[i]=p;document.dispatchEvent(new CustomEvent('opd-added',{detail:p}));}
const ready=allDemo('intake').then(rows=>{for(const row of rows)upsert({...row.value,_cloudPending:false});update()}).catch(()=>{document.getElementById('registration-status').textContent='Could not load local records. Check browser storage.'});
form.addEventListener('submit',async e=>{e.preventDefault();await ready;const p=Object.fromEntries(new FormData(form));for(const k of ['name','mobile','village'])p[k]=p[k].trim();const error=validatePatient(p);const status=document.getElementById('registration-status');if(error){status.textContent=error;return}
 const duplicate=list.find(x=>x.name===p.name&&x.mobile===p.mobile&&x.village===p.village);if(duplicate){status.textContent=`A matching record already exists: ${duplicate.id}`;return}
 p.id='VAC-OPD-'+p.visitDate.replaceAll('-','')+'-'+crypto.randomUUID();p.type='नवीन';p.enteredAt=new Date().toISOString();p.createdAt=p.enteredAt;p.createdBy='local-device';p._cloudPending=false;
 const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{await putDemo('intake',p.id,p);upsert(p);status.textContent=`Record saved on this device: ${p.id}. Include this record in your next backup.`;form.reset();date.value=todayIST();update();}
 catch{status.textContent='Record save failed. Check browser storage. Your entries remain in the form.'}
 finally{submit.disabled=false}
});
document.dispatchEvent(new Event('opd-request-samples'));
