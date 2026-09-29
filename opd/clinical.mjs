import {getAuthProvider} from './auth-context.mjs?v=24';
import {getDemo,putDemo,syntheticId} from './demo-store.mjs?v=24';
// Synthetic-only case-taking drafts. No localStorage, cloud writes or clinical advice.
const drafts=new Map();
const fields=[['bp','BP (mmHg)'],['pulse','Pulse (/min)'],['spo2','SpO₂ (%)'],['temperature','तापमान (°C)'],['weight','वजन (kg)'],['allergy','ॲलर्जी'],['history','पूर्वव्याधी / औषधांचा इतिहास'],['surgery','शस्त्रक्रिया / पूर्वीचे admission'],['addiction','व्यसनाची नोंद'],['nadi','नाडी'],['urine','मूत्र'],['stool','मल'],['tongue','जिह्वा'],['voice','शब्द'],['touch','स्पर्श'],['eyes','दृक्'],['build','आकृती'],['agni','अग्नी'],['strength','बल'],['notes','इतर निरीक्षणे']];
document.addEventListener('opd-case-open',e=>{
 const patient=e.detail,box=document.getElementById('case-content');if(!syntheticId(patient.id))return;
 const saved=drafts.get(patient.id)||{complaints:[{text:'',duration:'',severity:''}],values:{}};
 const summary=document.createElement('section');box.append(summary);
 const form=document.createElement('form');form.className='clinical-editor';
 const heading=document.createElement('h2');heading.textContent='केस-टेकिंग · काल्पनिक चाचणी';form.append(heading);
 const hint=document.createElement('p');hint.textContent='काल्पनिक तपासणी Firebase मध्ये जतन केल्यावर त्याच रुग्णाची नोंद इतर login केलेल्या Owner/Doctor किंवा संबंधित विद्यार्थी डिव्हाइसवर उघडता येते. जुनी नोंद आणण्यासाठी Firebase मधून उघडा वापरा. रिकामे field म्हणजे तपासणी नोंदवलेली नाही.';form.append(hint);
 const rows=document.createElement('div');form.append(rows);
 function addComplaint(c={text:'',duration:'',severity:''}){
  const row=document.createElement('div');row.className='complaint-row form-grid';
  for(const [key,label] of [['text','मुख्य तक्रार'],['duration','कालावधी (उदा. ५ दिवस)'],['severity','तीव्रता (स्वतः लिहा)']]){
   const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.dataset.key=key;input.maxLength=300;input.value=c[key]||'';l.append(input);row.append(l);
  }
  const remove=document.createElement('button');remove.type='button';remove.textContent='ही तक्रार काढा';remove.onclick=()=>row.remove();row.append(remove);rows.append(row);
 }
 saved.complaints.forEach(addComplaint);
 const add=document.createElement('button');add.type='button';add.textContent='＋ आणखी तक्रार';add.onclick=()=>addComplaint();form.append(add);
 const grid=document.createElement('div');grid.className='form-grid';
 for(const [key,label] of fields){const l=document.createElement('label');l.textContent=label;const input=document.createElement('input');input.name=key;input.maxLength=1000;input.value=saved.values[key]||'';l.append(input);grid.append(l)}form.append(grid);
 const button=document.createElement('button');button.type='submit';button.textContent='नमुना केस नोंद जतन करा';form.append(button);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);const cloud=document.createElement('button');cloud.type='button';cloud.textContent='Firebase मधून नमुना तपासणी उघडा';cloud.disabled=true;form.append(cloud);box.append(form);
 const forward=document.createElement('button');forward.type='button';forward.textContent='डॉक्टरांकडे पुनरावलोकनासाठी पाठवा';form.append(forward);
 function draw(data){summary.replaceChildren();const h=document.createElement('h2');h.textContent='नोंदवलेले परीक्षण · नमुना';summary.append(h);
  const lines=data.complaints.filter(c=>c.text).map((c,i)=>`${i+1}. ${c.text} · कालावधी: ${c.duration||'नोंद नाही'} · तीव्रता: ${c.severity||'नोंद नाही'}`);
  for(const [key,label] of fields)if(data.values[key])lines.push(`${label}: ${data.values[key]}`);
  if(!lines.length)lines.push('परीक्षणाची नोंद अद्याप केलेली नाही.');
  for(const text of lines){const p=document.createElement('p');p.textContent=text;summary.append(p)}
 }
 draw(saved);getDemo('clinical',patient.id).then(stored=>{if(!stored||drafts.has(patient.id))return;drafts.set(patient.id,stored);for(const row of [...rows.children])row.remove();(stored.complaints||[]).forEach(addComplaint);for(const [key] of fields)form.elements[key].value=stored.values?.[key]||'';draw(stored);cloud.disabled=false}).then(()=>{cloud.disabled=false}).catch(()=>{status.textContent='या ब्राउझरमध्ये स्थानिक साठवण उपलब्ध नाही.'});
 form.addEventListener('submit',async event=>{event.preventDefault();const complaints=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.key,input.value.trim()])));
  if(complaints.some(c=>!c.text&&(c.duration||c.severity))){status.textContent='कालावधी किंवा तीव्रतेसोबत तक्रारीचे नाव भरा.';return}
  const values=Object.fromEntries(new FormData(form));
  const data={complaints,values};try{await putDemo('clinical',patient.id,data);drafts.set(patient.id,data);draw(data);status.textContent='काल्पनिक केस या डिव्हाइसवर जतन झाला.';const auth=getAuthProvider();if(auth?.current()){try{await auth.saveDemoClinical(patient.id,data);status.textContent='काल्पनिक तपासणी या डिव्हाइसवर आणि Firebase मध्ये जतन झाली.'}catch(error){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();status.textContent=`स्थानिक जतन झाले; Firebase sync अयशस्वी · ${code}.`}}}catch{status.textContent='जतन झाले नाही; ब्राउझर साठवण तपासा.'};
 });
 cloud.addEventListener('click',async()=>{const auth=getAuthProvider();if(!auth?.current()){status.textContent='Firebase login करा.';return}cloud.disabled=true;try{const remote=await auth.loadDemoClinical(patient.id);if(drafts.has(patient.id)&&!confirm('Firebase वरील काल्पनिक तपासणी या डिव्हाइसवरील मसुद्यावर लिहायची?'))return;await putDemo('clinical',patient.id,remote.payload);drafts.set(patient.id,remote.payload);rows.replaceChildren();remote.payload.complaints.forEach(addComplaint);for(const [key] of fields)form.elements[key].value=remote.payload.values[key]||'';draw(remote.payload);status.textContent='Firebase वरील काल्पनिक तपासणी उघडली.'}catch(error){const code=String(error?.code||error?.message||'UNKNOWN_ERROR').replace(/[^A-Za-z0-9_]/g,'').toUpperCase();status.textContent=`Firebase तपासणी उघडली नाही · ${code}.`}finally{cloud.disabled=false}});
 forward.addEventListener('click',()=>{const data=drafts.get(patient.id);if(!data){status.textContent='आधी नमुना केस नोंद जतन करा.';return}document.dispatchEvent(new CustomEvent('opd-clinical-review-submit',{detail:{patient,data,submittedAt:new Date().toISOString()}}));status.textContent='नमुना केस डॉक्टर पुनरावलोकन यादीत पाठवली. ही पुनरावलोकन यादी refresh झाल्यावर मिटते.'});
});
