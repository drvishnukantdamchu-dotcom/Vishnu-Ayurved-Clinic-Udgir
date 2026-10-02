import {allDemo,putDemo,deleteDemo,syntheticId} from './demo-store.mjs?v=27';
import {todayIST} from './patient-model.mjs?v=27';
// Synthetic appointments live only in this tab. Completing one is not a clinical visit.
const appointments=new Map();
const section=document.getElementById('followups');
section.innerHTML=`<h2>Follow-ups · Sample</h2><p>Follow-ups appear after saving a sample prescription with a follow-up date. These appointments remain on this device. Completing a follow-up does not create a new OPD visit.</p><div class="form-grid"><label>Name / ID / mobile<input id="followup-search" type="search"></label><label>List<select id="followup-filter"><option value="pending">All pending visits</option><option value="today">Today’s visits</option><option value="overdue">Overdue</option><option value="upcoming">Follow-ups</option><option value="done">Completed</option></select></label></div><p id="followup-count" role="status"></p><div id="followup-list"></div>`;
const search=document.getElementById('followup-search'),filter=document.getElementById('followup-filter'),list=document.getElementById('followup-list');
function draw(){
 const today=todayIST(),q=search.value.trim().toLocaleLowerCase();
 const rows=[...appointments.values()].filter(a=>{
  if(![a.patient.name,a.patient.id,a.patient.mobile||''].join(' ').toLocaleLowerCase().includes(q))return false;
  if(filter.value==='done')return a.done;
  if(a.done)return false;
  return filter.value==='pending'||(filter.value==='today'&&a.date===today)||(filter.value==='overdue'&&a.date<today)||(filter.value==='upcoming'&&a.date>today);
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.patient.name.localeCompare(b.patient.name));
 list.replaceChildren();document.getElementById('followup-count').textContent=`Matching sample appointments: ${rows.length}`;
 if(!rows.length){list.textContent='No appointments match this filter. Patient search → Prescription → Enter a follow-up date and save the draft.';return}
 for(const a of rows){const card=document.createElement('article');card.className='panel';const title=document.createElement('h3');title.textContent=a.patient.name;const info=document.createElement('p');info.textContent=`${a.patient.id} · ${a.date} · ${a.done?'Complete':a.date<today?'Overdue':a.date===today?'Today':'Upcoming visit'}${a.patient.mobile?' · '+a.patient.mobile:''}`;
 const open=document.createElement('button');open.textContent='Open case paper';open.onclick=()=>document.dispatchEvent(new CustomEvent('opd-open-patient',{detail:a.patient}));
 const toggle=document.createElement('button');toggle.textContent=a.done?'Mark pending again':'Mark visit complete';toggle.onclick=async()=>{const next={...a,done:!a.done};try{await putDemo('followup',a.patient.id,next);appointments.set(a.patient.id,next);draw()}catch{document.getElementById('followup-count').textContent='Status save failed.'}};card.append(title,info,open,toggle);list.append(card)}
}
document.addEventListener('opd-prescription-saved',async e=>{const {patient,followup}=e.detail,previous=appointments.get(patient.id);if(!syntheticId(patient.id))return;try{if(!followup){await deleteDemo('followup',patient.id);appointments.delete(patient.id)}else{const next={patient,date:followup,done:previous?.date===followup?previous.done:false};await putDemo('followup',patient.id,next);appointments.set(patient.id,next)}draw()}catch{document.getElementById('followup-count').textContent='Follow-up save failed.'}});
search.addEventListener('input',draw);filter.addEventListener('change',draw);document.addEventListener('visibilitychange',()=>{if(!document.hidden)draw()});draw();

allDemo('followup').then(rows=>{for(const r of rows)if(r.value?.patient?.id===r.id&&/^\d{4}-\d{2}-\d{2}$/.test(r.value.date||''))appointments.set(r.id,r.value);draw()}).catch(()=>{document.getElementById('followup-count').textContent='Local follow-up storage unavailable.'});
