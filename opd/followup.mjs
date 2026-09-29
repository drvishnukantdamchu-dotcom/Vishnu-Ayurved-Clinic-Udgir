import {allDemo,putDemo,deleteDemo,syntheticId} from './demo-store.mjs?v=25';
import {todayIST} from './patient-model.mjs';
// Synthetic appointments live only in this tab. Completing one is not a clinical visit.
const appointments=new Map();
const section=document.getElementById('followups');
section.innerHTML=`<h2>पुढील भेटी · नमुना</h2><p class="notice">प्रिस्क्रिप्शनचा नमुना मसुदा जतन केल्यावर पुढील भेट येथे दिसेल. या डिव्हाइसवर नोंदी टिकतात; इतर डिव्हाइसवर नाहीत. भेट पूर्ण केल्याने नवीन OPD केस तयार होत नाही.</p><div class="form-grid"><label>नाव / ID / मोबाइल<input id="followup-search" type="search"></label><label>यादी<select id="followup-filter"><option value="pending">सर्व बाकी भेटी</option><option value="today">आजच्या भेटी</option><option value="overdue">तारीख उलटलेल्या</option><option value="upcoming">पुढील भेटी</option><option value="done">पूर्ण झालेल्या</option></select></label></div><p id="followup-count" role="status"></p><div id="followup-list"></div>`;
const search=document.getElementById('followup-search'),filter=document.getElementById('followup-filter'),list=document.getElementById('followup-list');
function draw(){
 const today=todayIST(),q=search.value.trim().toLocaleLowerCase();
 const rows=[...appointments.values()].filter(a=>{
  if(![a.patient.name,a.patient.id,a.patient.mobile||''].join(' ').toLocaleLowerCase().includes(q))return false;
  if(filter.value==='done')return a.done;
  if(a.done)return false;
  return filter.value==='pending'||(filter.value==='today'&&a.date===today)||(filter.value==='overdue'&&a.date<today)||(filter.value==='upcoming'&&a.date>today);
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.patient.name.localeCompare(b.patient.name));
 list.replaceChildren();document.getElementById('followup-count').textContent=`जुळणाऱ्या नमुना भेटी: ${rows.length}`;
 if(!rows.length){list.textContent='या निवडीसाठी भेट नाही. रुग्ण शोध → प्रिस्क्रिप्शन → पुढील भेटीची तारीख भरा आणि मसुदा जतन करा.';return}
 for(const a of rows){const card=document.createElement('article');card.className='panel';const title=document.createElement('h3');title.textContent=a.patient.name;const info=document.createElement('p');info.textContent=`${a.patient.id} · ${a.date} · ${a.done?'पूर्ण':a.date<today?'तारीख उलटली':a.date===today?'आज':'पुढील भेट'}${a.patient.mobile?' · '+a.patient.mobile:''}`;
 const open=document.createElement('button');open.textContent='केस पेपर उघडा';open.onclick=()=>document.dispatchEvent(new CustomEvent('opd-open-patient',{detail:a.patient}));
 const toggle=document.createElement('button');toggle.textContent=a.done?'पुन्हा बाकी ठेवा':'भेट पूर्ण म्हणून नोंदवा';toggle.onclick=async()=>{const next={...a,done:!a.done};try{await putDemo('followup',a.patient.id,next);appointments.set(a.patient.id,next);draw()}catch{document.getElementById('followup-count').textContent='स्थिती जतन झाली नाही.'}};card.append(title,info,open,toggle);list.append(card)}
}
document.addEventListener('opd-prescription-saved',async e=>{const {patient,followup}=e.detail,previous=appointments.get(patient.id);if(!syntheticId(patient.id))return;try{if(!followup){await deleteDemo('followup',patient.id);appointments.delete(patient.id)}else{const next={patient,date:followup,done:previous?.date===followup?previous.done:false};await putDemo('followup',patient.id,next);appointments.set(patient.id,next)}draw()}catch{document.getElementById('followup-count').textContent='फॉलो-अप जतन झाला नाही.'}});
search.addEventListener('input',draw);filter.addEventListener('change',draw);document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});draw();

allDemo('followup').then(rows=>{for(const r of rows)if(r.value?.patient?.id===r.id&&/^\d{4}-\d{2}-\d{2}$/.test(r.value.date||''))appointments.set(r.id,r.value);draw()}).catch(()=>{document.getElementById('followup-count').textContent='स्थानिक फॉलो-अप साठवण उपलब्ध नाही.'});
