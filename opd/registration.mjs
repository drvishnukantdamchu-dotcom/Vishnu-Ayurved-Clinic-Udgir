import {todayIST,validatePatient,searchPatients} from './patient-model.mjs';
import './clinical.mjs?v=16';
import './prescription.mjs?v=16';
import './panchakarma.mjs?v=16';
import './followup.mjs?v=16';
import './reports.mjs?v=16';
import './documents.mjs?v=16';
import './review.mjs?v=16';
import {getAuthProvider} from './auth-context.mjs?v=16';
const section=document.getElementById('patients');
document.querySelector('label[for="search"]').textContent='नाव, Patient ID, गाव किंवा मोबाइल';
const panel=document.createElement('details');panel.className='panel';
panel.innerHTML=`<summary>＋ नवीन नमुना रुग्ण नोंदवा</summary><p class="notice">फक्त काल्पनिक माहिती वापरा. Login व Firestore नियम सक्रिय असल्यास नाव/संपर्क/भेट तारीख सुरक्षित rules अंतर्गत Firebase patient intakeमध्ये जतन होईल; अन्यथा ही नोंद फक्त या टॅबमध्ये राहील. इतर clinical माहिती या टप्प्यात cloudमध्ये जात नाही.</p>
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
async function syncCloud(){const auth=getAuthProvider(),user=auth?.current();if(!user){cloudStatus.textContent='पहिले Firebase login करा.';cloudButton.disabled=true;return}cloudButton.disabled=true;cloudStatus.textContent='Firebase मधून नमुना patient intake आणत आहे…';try{const remote=await auth.listPatientIntakes();for(const p of remote){const i=list.findIndex(x=>x.id===p.id);if(i<0){list.push(p);document.dispatchEvent(new CustomEvent('opd-added',{detail:p}))}else list[i]=p}const pending=list.filter(p=>p._cloudPending);for(const p of pending){const saved=await auth.savePatientIntake(p);Object.assign(p,saved,{_cloudPending:false})}update();cloudStatus.textContent=`Firebase sync पूर्ण · ${remote.length} cloud नोंदी व ${pending.length} नवीन नमुना नोंदी sync केल्या.`}catch{cloudStatus.textContent='Firebase sync अयशस्वी. Firestore rules publish आहेत का, इंटरनेट आणि सक्रिय user भूमिका तपासा.'}finally{cloudButton.disabled=false}}
cloudButton.addEventListener('click',syncCloud);window.addEventListener('opd-auth-change',e=>{cloudButton.disabled=!e.detail;if(e.detail)syncCloud();else cloudStatus.textContent='Firebase login केल्यावर नमुना intake sync करता येईल.'});
form.addEventListener('submit',async e=>{e.preventDefault();const p=Object.fromEntries(new FormData(form));for(const k of ['name','mobile','village'])p[k]=p[k].trim();const error=validatePatient(p);const status=document.getElementById('registration-status');if(error){status.textContent=error;return}
 const duplicate=list.find(x=>x.name===p.name&&x.mobile===p.mobile&&x.village===p.village);if(duplicate){status.textContent=`अशी नमुना नोंद आधीच आहे: ${duplicate.id}`;return}
 p.id='VAC-DEMO-'+crypto.randomUUID();p.type='नवीन';p.enteredAt=new Date().toISOString();p._cloudPending=true;list.push(p);document.dispatchEvent(new CustomEvent('opd-added',{detail:p}));status.textContent=`नमुना नोंद जोडली: ${p.id}. भेटीची तारीख आणि प्रत्यक्ष नोंदणीची वेळ स्वतंत्र ठेवली आहे.`;form.reset();date.value=todayIST();update();if(getAuthProvider()?.current())await syncCloud();
});
document.dispatchEvent(new Event('opd-request-samples'));
