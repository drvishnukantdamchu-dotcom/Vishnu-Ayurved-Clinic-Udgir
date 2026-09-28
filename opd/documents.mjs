import {todayIST} from './patient-model.mjs';
// Temporary prototype: browser-memory-only attachments for synthetic VAC-DEMO records.
const attachments=new Map(),MAX_BYTES=5*1024*1024,MAX_FILES=20;
document.addEventListener('opd-case-open',event=>{
 const patient=event.detail;if(!String(patient.id).startsWith('VAC-DEMO-'))return;
 const box=document.getElementById('case-content'),records=attachments.get(patient.id)||[];
 const section=document.createElement('section');section.className='document-section';
 const heading=document.createElement('h2');heading.textContent='रिपोर्ट / X-ray फाइल्स · नमुना';section.append(heading);
 const summary=document.createElement('div');summary.className='document-print-list';section.append(summary);
 const form=document.createElement('form');form.className='clinical-editor document-form';
 const notice=document.createElement('p');notice.className='notice';notice.textContent='फक्त काल्पनिक फाइल वापरा. फाइल या टॅबच्या मेमरीतच असते; Refresh/टॅब बंद केल्यावर मिटते. Firebase/Drive वर पाठवली जात नाही. वास्तविक रुग्णांचे रिपोर्ट अपलोड करू नका.';form.append(notice);
 const grid=document.createElement('div');grid.className='form-grid';form.append(grid);
 function field(caption,type){const l=document.createElement('label');l.textContent=caption;const control=document.createElement('input');control.type=type;l.append(control);grid.append(l);return control}
 const label=field('फाइलचे शीर्षक (उदा. नमुना CBC)','text');label.maxLength=100;label.placeholder='नमुना रिपोर्ट';
 const file=field('PDF / JPG / PNG (कमाल 5 MB)','file');file.accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
 const check=document.createElement('label');const cb=document.createElement('input');cb.type='checkbox';cb.required= true;cb.style.width='auto';check.append(cb,document.createTextNode(' ही काल्पनिक, गैर-रुग्ण फाइल आहे.'));form.append(check);
 const add=document.createElement('button');add.type='submit';add.textContent='तात्पुरती फाइल जोडा';form.append(add);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);section.append(form);box.append(section);
 function draw(){summary.replaceChildren();if(!records.length){const p=document.createElement('p');p.textContent='या नमुना रुग्णासाठी फाइल जोडलेली नाही.';summary.append(p);return}
  for(const [i,r] of records.entries()){const row=document.createElement('div');row.className='row document-row';const text=document.createElement('span');text.textContent=`${r.title} · ${r.name} · ${r.date} · ${(r.size/1024).toFixed(0)} KB`;const open=document.createElement('a');open.href=r.url;open.target='_blank';open.rel='noopener noreferrer';open.textContent=r.type==='application/pdf'?'PDF उघडा':'प्रतिमा उघडा';open.setAttribute('aria-label',`${r.title} ${open.textContent}`);const download=document.createElement('a');download.href=r.url;download.download=r.name;download.textContent='डाउनलोड';const remove=document.createElement('button');remove.type='button';remove.textContent='काढा';remove.onclick=()=>{URL.revokeObjectURL(r.url);records.splice(i,1);draw()};row.append(text,open,download,remove);summary.append(row)}
 }
 draw();form.addEventListener('submit',e=>{e.preventDefault();const f=file.files?.[0];if(!f){status.textContent='फाइल निवडा.';return}if(f.size>MAX_BYTES){status.textContent='फाइल 5 MB पेक्षा लहान असावी.';return}if(!['application/pdf','image/jpeg','image/png'].includes(f.type)){status.textContent='फक्त PDF, JPG किंवा PNG फाइल जोडा.';return}if(records.length>=MAX_FILES){status.textContent='एका नमुना रुग्णासाठी कमाल 20 फाइल्स जोडता येतात.';return}
  const safeName=f.name.replace(/[\r\n]/g,' ').slice(0,160),titleText=(label.value.trim()||safeName).slice(0,100),url=URL.createObjectURL(f);records.push({title:titleText,name:safeName,type:f.type,size:f.size,date:todayIST(),url});attachments.set(patient.id,records);file.value='';label.value='';cb.checked=false;draw();status.textContent='फाइल फक्त या टॅबमध्ये तात्पुरती जोडली. Refresh केल्यावर ती मिटेल.';
 });
});
window.addEventListener('pagehide',()=>{for(const list of attachments.values())for(const file of list)URL.revokeObjectURL(file.url)});
