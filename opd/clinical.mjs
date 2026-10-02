import {getAuthProvider} from './auth-context.mjs?v=27';
import {getDemo,putDemo,syntheticId} from './demo-store.mjs?v=27';
// Synthetic-only case-taking drafts. No localStorage, cloud writes or clinical advice.
const drafts=new Map();
const fields=[['bp','BP (mmHg)'],['pulse','Pulse (/min)'],['spo2','SpO₂ (%)'],['temperature','Temperature (°C)'],['weight','Weight (kg)'],['allergy','Allergies'],['history','Medical / medication history'],['surgery','Surgical history / previous admissions'],['addiction','Substance use history'],['nadi','Nadi (pulse examination)'],['urine','Mutra (urine)'],['stool','Mala (stool)'],['tongue','Jihva (tongue)'],['voice','Shabda (voice)'],['touch','Sparsha (touch)'],['eyes','Drik (eyes)'],['build','Akruti (build)'],['agni','Agni (digestion)'],['strength','Bala (strength)'],['notes','Other observations']];
document.addEventListener('opd-case-open',e=>{
 const patient=e.detail,box=document.getElementById('case-content');if(!syntheticId(patient.id))return;
 const saved=drafts.get(patient.id)||{complaints:[{text:'',duration:'',severity:''}],values:{}};
 const summary=document.createElement('section');box.append(summary);
 const form=document.createElement('form');form.className='clinical-editor';
 const heading=document.createElement('h2');heading.textContent='Case taking · Sample draft';form.append(heading);
 const hint=document.createElement('p');hint.textContent='Save sample examinations to Firebase and open them on another authorised device. Use Open examination from Firebase to retrieve a previous record. Blank fields mean not recorded.';form.append(hint);
 const rows=document.createElement('div');form.append(rows);
 function addComplaint(c={text:'',duration:'',severity:''}){
  const row=document.createElement('div');row.className='complaint-row form-grid';
  for(const [key,label] of [['text','Chief complaint'],['duration','Duration (e.g. 5 days)'],['severity','Severity (free text)']]){
   const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.dataset.key=key;input.maxLength=300;input.value=c[key]||'';l.append(input);row.append(l);
  }
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remove complaint';remove.onclick=()=>row.remove();row.append(remove);rows.append(row);
 }
 saved.complaints.forEach(addComplaint);
 const add=document.createElement('button');add.type='button';add.textContent='＋ Add complaint';add.onclick=()=>addComplaint();form.append(add);
 const grid=document.createElement('div');grid.className='form-grid';
 for(const [key,label] of fields){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.name=key;input.maxLength=1000;input.value=saved.values[key]||'';l.append(input);grid.append(l)}form.append(grid);
 const button=document.createElement('button');button.type='submit';button.textContent='Save sample case';form.append(button);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);const cloud=document.createElement('button');cloud.type='button';cloud.textContent='Open examination from Firebase';cloud.disabled=true;form.append(cloud);box.append(form);
 const forward=document.createElement('button');forward.type='button';forward.textContent='Send to doctor review';form.append(forward);
 function draw(data){summary.replaceChildren();const h=document.createElement('h2');h.textContent='Recorded examination · Sample';summary.append(h);
  const lines=data.complaints.filter(c=>c.text).map((c,i)=>`${i+1}. ${c.text} · Duration: ${c.duration||'Not recorded'} · Severity: ${c.severity||'Not recorded'}`);
  for(const [key,label] of fields)if(data.values[key])lines.push(`${label}: ${data.values[key]}`);
  if(!lines.length)lines.push('No examination recorded yet.');
  for(const text of lines){const p=document.createElement('p');p.textContent=text;summary.append(p)}
 }
 draw(saved);getDemo('clinical',patient.id).then(stored=>{if(!stored||drafts.has(patient.id))return;drafts.set(patient.id,stored);for(const row of [...rows.children])row.remove();(stored.complaints||[]).forEach(addComplaint);for(const [key] of fields)form.elements[key].value=stored.values?.[key]||'';draw(stored);cloud.disabled=false}).then(()=>{cloud.disabled=false}).catch(()=>{status.textContent='Local storage is unavailable in this browser.'});
 form.addEventListener('submit',async event=>{event.preventDefault();const complaints=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.key,input.value.trim()])));
  if(complaints.some(c=>!c.text&&(c.duration||c.severity))){status.textContent='Enter a complaint with its duration or severity.';return}
  const values=Object.fromEntries(new FormData(form));
  const data={complaints,values};try{await putDemo('clinical',patient.id,data);drafts.set(patient.id,data);draw(data);status.textContent='Sample case saved on this device.';const auth=getAuthProvider();if(auth?.current()){try{await auth.saveDemoClinical(patient.id,data);status.textContent='Sample examination saved on this device and Firebase.'}catch(error){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();status.textContent=`Saved locally; Firebase sync failed · ${code}.`}}}catch{status.textContent='Save failed. Check browser storage.'};
 });
 cloud.addEventListener('click',async()=>{const auth=getAuthProvider();if(!auth?.current()){status.textContent='Sign in to Firebase.';return}cloud.disabled=true;try{const remote=await auth.loadDemoClinical(patient.id);if(drafts.has(patient.id)&&!confirm('Replace this device’s draft with the sample examination from Firebase?'))return;await putDemo('clinical',patient.id,remote.payload);drafts.set(patient.id,remote.payload);rows.replaceChildren();remote.payload.complaints.forEach(addComplaint);for(const [key] of fields)form.elements[key].value=remote.payload.values[key]||'';draw(remote.payload);status.textContent='Sample examination opened from Firebase.'}catch(error){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();status.textContent=`Could not open Firebase examination · ${code}.`}finally{cloud.disabled=false}});
 forward.addEventListener('click',()=>{const data=drafts.get(patient.id);if(!data){status.textContent='Save the sample case first.';return}document.dispatchEvent(new CustomEvent('opd-clinical-review-submit',{detail:{patient,data,submittedAt:new Date().toISOString()}}));status.textContent='Sample case sent for doctor review. This review queue clears on refresh.'});
});
