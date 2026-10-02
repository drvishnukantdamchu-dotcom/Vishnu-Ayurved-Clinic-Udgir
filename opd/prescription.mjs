import {getDemo,putDemo,syntheticId} from './demo-store.mjs?v=30';
// Demo drafts only: no approvals, recommendations, signatures or persistent records.
const prescriptions=new Map();
const drugFields=[['name','Medicine name'],['form','Form (Vati / Churna / Kwath / other)'],['dose','Dose and unit (tablet / g / ml)'],['times','Timing (morning / noon / evening / night)'],['food','Before / after food / bedtime'],['vehicle','Anupana (vehicle)'],['duration','Duration'],['site','Application site and instructions']];
document.addEventListener('opd-case-open',event=>{
 const id=event.detail.id,box=document.getElementById('case-content');if(!syntheticId(id))return;
 const data=prescriptions.get(id)||{diagnosis:'',advice:'',followup:'',drugs:[]};
 const summary=document.createElement('section');summary.className='prescription-summary';box.append(summary);
 const form=document.createElement('form');form.className='clinical-editor';form.id='prescription-editor';
 const h=document.createElement('h2');h.textContent='Diagnosis and prescription';form.append(h);
 const warning=document.createElement('p');warning.className='notice';warning.textContent='Medicines and doses are entered by the clinician. Review the completed prescription before printing. Records are saved on this device.';form.append(warning);
 function field(parent,name,label,value='',multiline=false){const l=document.createElement('label');l.textContent=label;const input=document.createElement(multiline?'textarea':'input');input.name=name;input.maxLength=multiline?2000:300;input.value=value;l.append(input);parent.append(l);return input;}
 const diagnosis=field(form,'diagnosis','Provisional diagnosis / dominant dosha (optional; one or more)',data.diagnosis,true);
 const rows=document.createElement('div');form.append(rows);
 function addDrug(drug={}){const row=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent='Medicine entry';row.append(legend);const grid=document.createElement('div');grid.className='form-grid';row.append(grid);for(const [key,label]of drugFields)field(grid,key,label,drug[key]||'');const remove=document.createElement('button');remove.type='button';remove.textContent='Remove medicine';remove.onclick=()=>row.remove();row.append(remove);rows.append(row);}
 data.drugs.forEach(addDrug);
 const add=document.createElement('button');add.type='button';add.textContent='＋ Add medicine';add.onclick=()=>addDrug();form.append(add);
 const advice=field(form,'advice','Diet / investigations / other instructions',data.advice,true);
 const followup=field(form,'followup','Follow-up date',data.followup);followup.type='date';
 const save=document.createElement('button');save.type='submit';save.textContent='Save prescription';form.append(save);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);box.append(form);
 function draw(d){summary.replaceChildren();const title=document.createElement('h2');title.textContent='OPD Prescription';summary.append(title);
  function line(text){const p=document.createElement('p');p.textContent=text;summary.append(p);}
  line('Diagnosis / dosha: '+(d.diagnosis||'Not recorded'));
  if(!d.drugs.length)line('No medicines recorded.');
  d.drugs.forEach((drug,i)=>{line(`${i+1}. ${drug.name}`);for(const [key,label]of drugFields.slice(1))if(drug[key])line(`${label}: ${drug[key]}`)});
  if(d.advice)line('Instructions: '+d.advice);if(d.followup)line('Follow-up: '+d.followup);
 }
 draw(data);getDemo('prescription',id).then(stored=>{if(!stored||prescriptions.has(id))return;prescriptions.set(id,stored);diagnosis.value=stored.diagnosis||'';advice.value=stored.advice||'';followup.value=stored.followup||'';rows.replaceChildren();(stored.drugs||[]).forEach(addDrug);draw(stored)}).catch(()=>{status.textContent='Local storage is unavailable in this browser.'});
 form.addEventListener('submit',async e=>{e.preventDefault();const drugs=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.name,input.value.trim()]))).filter(d=>Object.values(d).some(Boolean));
  if(drugs.some(d=>!d.name)){status.textContent='Enter the medicine name or remove the empty entry.';return}if(drugs.length>20){status.textContent='A draft can contain up to 20 medicines.';return}
  const next={diagnosis:diagnosis.value.trim(),advice:advice.value.trim(),followup:followup.value,drugs};try{await putDemo('prescription',id,next);prescriptions.set(id,next);draw(next);document.dispatchEvent(new CustomEvent('opd-prescription-saved',{detail:{patient:event.detail,followup:next.followup}}));status.textContent='Prescription saved on this device.';}catch{status.textContent='Save failed. Check browser storage.'};
 });
});
