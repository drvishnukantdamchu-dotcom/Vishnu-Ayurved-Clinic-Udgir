import {getDemo,putDemo,syntheticId} from './demo-store.mjs?v=19';
// Demo drafts only: no approvals, recommendations, signatures or persistent records.
const prescriptions=new Map();
const drugFields=[['name','औषधाचे नाव'],['form','प्रकार (वटी / चूर्ण / क्वाथ / इतर)'],['dose','मात्रा व एकक (गोळी / g / ml)'],['times','वेळा (सकाळ / दुपार / संध्याकाळ / रात्र)'],['food','जेवणाशी संबंध / झोपताना'],['vehicle','अनुपान'],['duration','कालावधी'],['site','बाह्य वापराची जागा व पद्धत']];
document.addEventListener('opd-case-open',event=>{
 const id=event.detail.id,box=document.getElementById('case-content');if(!syntheticId(id))return;
 const data=prescriptions.get(id)||{diagnosis:'',advice:'',followup:'',drugs:[]};
 const summary=document.createElement('section');summary.className='prescription-summary';box.append(summary);
 const form=document.createElement('form');form.className='clinical-editor';form.id='prescription-editor';
 const h=document.createElement('h2');h.textContent='निदान व प्रिस्क्रिप्शन · नमुना मसुदा';form.append(h);
 const warning=document.createElement('p');warning.className='notice';warning.textContent='फक्त काल्पनिक चाचणी. हा मंजूर प्रिस्क्रिप्शन नाही. औषधे किंवा मात्रा आपोआप सुचवली जात नाहीत.';form.append(warning);
 function field(parent,name,label,value='',multiline=false){const l=document.createElement('label');l.textContent=label;const input=document.createElement(multiline?'textarea':'input');input.name=name;input.maxLength=multiline?2000:300;input.value=value;l.append(input);parent.append(l);return input;}
 const diagnosis=field(form,'diagnosis','संभाव्य निदान / दोषप्रधानता (एक किंवा अनेक; ऐच्छिक)',data.diagnosis,true);
 const rows=document.createElement('div');form.append(rows);
 function addDrug(drug={}){const row=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent='औषधाची नोंद';row.append(legend);const grid=document.createElement('div');grid.className='form-grid';row.append(grid);for(const [key,label]of drugFields)field(grid,key,label,drug[key]||'');const remove=document.createElement('button');remove.type='button';remove.textContent='हे औषध काढा';remove.onclick=()=>row.remove();row.append(remove);rows.append(row);}
 data.drugs.forEach(addDrug);
 const add=document.createElement('button');add.type='button';add.textContent='＋ औषध जोडा';add.onclick=()=>addDrug();form.append(add);
 const advice=field(form,'advice','पथ्य–अपथ्य / तपासण्या / इतर सूचना',data.advice,true);
 const followup=field(form,'followup','पुढील भेटीची तारीख',data.followup);followup.type='date';
 const save=document.createElement('button');save.type='submit';save.textContent='नमुना मसुदा जतन करा';form.append(save);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);box.append(form);
 function draw(d){summary.replaceChildren();const title=document.createElement('h2');title.textContent='प्रिस्क्रिप्शन मसुदा — उपचारासाठी वापरू नये';summary.append(title);
  function line(text){const p=document.createElement('p');p.textContent=text;summary.append(p);}
  line('निदान / दोषप्रधानता: '+(d.diagnosis||'नोंद नाही'));
  if(!d.drugs.length)line('औषधांची नोंद नाही.');
  d.drugs.forEach((drug,i)=>{line(`${i+1}. ${drug.name}`);for(const [key,label]of drugFields.slice(1))if(drug[key])line(`${label}: ${drug[key]}`)});
  if(d.advice)line('सूचना: '+d.advice);if(d.followup)line('पुढील भेट: '+d.followup);
 }
 draw(data);getDemo('prescription',id).then(stored=>{if(!stored||prescriptions.has(id))return;prescriptions.set(id,stored);diagnosis.value=stored.diagnosis||'';advice.value=stored.advice||'';followup.value=stored.followup||'';rows.replaceChildren();(stored.drugs||[]).forEach(addDrug);draw(stored)}).catch(()=>{status.textContent='या ब्राउझरमध्ये स्थानिक साठवण उपलब्ध नाही.'});
 form.addEventListener('submit',async e=>{e.preventDefault();const drugs=[...rows.children].map(row=>Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.name,input.value.trim()]))).filter(d=>Object.values(d).some(Boolean));
  if(drugs.some(d=>!d.name)){status.textContent='औषधाचे नाव भरा किंवा रिकामी औषध नोंद काढा.';return}
  const next={diagnosis:diagnosis.value.trim(),advice:advice.value.trim(),followup:followup.value,drugs};try{await putDemo('prescription',id,next);prescriptions.set(id,next);draw(next);document.dispatchEvent(new CustomEvent('opd-prescription-saved',{detail:{patient:event.detail,followup:next.followup}}));status.textContent='काल्पनिक मसुदा या डिव्हाइसवर जतन झाला. फॉलो-अप यादी आणि केस पेपर प्रिंट तपासा.'}catch{status.textContent='जतन झाले नाही; ब्राउझर साठवण तपासा.'};
 });
});
