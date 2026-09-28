// Synthetic-only case-taking drafts. No localStorage, cloud writes or clinical advice.
const drafts=new Map();
const fields=[['bp','BP (mmHg)'],['pulse','Pulse (/min)'],['spo2','SpO₂ (%)'],['temperature','तापमान (°C)'],['weight','वजन (kg)'],['allergy','ॲलर्जी'],['history','पूर्वव्याधी / औषधांचा इतिहास'],['surgery','शस्त्रक्रिया / पूर्वीचे admission'],['addiction','व्यसनाची नोंद'],['nadi','नाडी'],['urine','मूत्र'],['stool','मल'],['tongue','जिह्वा'],['voice','शब्द'],['touch','स्पर्श'],['eyes','दृक्'],['build','आकृती'],['agni','अग्नी'],['strength','बल'],['notes','इतर निरीक्षणे']];
document.addEventListener('opd-case-open',e=>{
 const patient=e.detail,box=document.getElementById('case-content');
 const saved=drafts.get(patient.id)||{complaints:[{text:'',duration:'',severity:''}],values:{}};
 const summary=document.createElement('section');box.append(summary);
 const form=document.createElement('form');form.className='clinical-editor';
 const heading=document.createElement('h2');heading.textContent='केस-टेकिंग · काल्पनिक चाचणी';form.append(heading);
 const hint=document.createElement('p');hint.textContent='नोंदी या टॅबपुरत्या राहतील. रिकामे field म्हणजे तपासणी नोंदवलेली नाही; सामान्य असल्याचे गृहीत धरले जाणार नाही.';form.append(hint);
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
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);box.append(form);
 const forward=document.createElement('button');forward.type='button';forward.textContent='डॉक्टरांकडे पुनरावलोकनासाठी पाठवा';form.append(forward);
 function draw(data){summary.replaceChildren();const h=document.createElement('h2');h.textContent='नोंदवलेले परीक्षण · नमुना';summary.append(h);
  const lines=data.complaints.filter(c=>c.text).map((c,i)=>`${i+1}. ${c.text} · कालावधी: ${c.duration||'नोंद नाही'} · तीव्रता: ${c.severity||'नोंद नाही'}`);
  for(const [key,label] of fields)if(data.values[key])lines.push(`${label}: ${data.values[key]}`);
  if(!lines.length)lines.push('परीक्षणाची नोंद अद्याप केलेली नाही.');
  for(const text of lines){const p=document.createElement('p');p.textContent=text;summary.append(p)}
 }
 draw(saved);
 form.addEventListener('submit',event=>{event.preventDefault();const complaints=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.key,input.value.trim()])));
  if(complaints.some(c=>!c.text&&(c.duration||c.severity))){status.textContent='कालावधी किंवा तीव्रतेसोबत तक्रारीचे नाव भरा.';return}
  const values=Object.fromEntries(new FormData(form));
  const data={complaints,values};drafts.set(patient.id,data);draw(data);status.textContent='या टॅबमध्ये नमुना केस जतन केला. आता खालील प्रिंट बटण वापरा. Refresh केल्यावर नोंद मिटेल.';
 });
 forward.addEventListener('click',()=>{const data=drafts.get(patient.id);if(!data){status.textContent='आधी नमुना केस नोंद जतन करा.';return}document.dispatchEvent(new CustomEvent('opd-clinical-review-submit',{detail:{patient,data,submittedAt:new Date().toISOString()}}));status.textContent='नमुना केस डॉक्टर पुनरावलोकन यादीत पाठवली. ही माहिती फक्त या टॅबमध्ये राहते.'});
});
