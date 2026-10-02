import {getDemo,putDemo} from './demo-store.mjs?v=34';
import {todayIST} from './patient-model.mjs?v=34';
// Temporary prototype: browser-memory-only attachments for synthetic VAC-DEMO records.
const attachments=new Map(),MAX_BYTES=5*1024*1024,MAX_FILES=20;
document.addEventListener('opd-case-open',event=>{
 const patient=event.detail;if(!String(patient.id).startsWith('VAC-OPD-'))return;
 const box=document.getElementById('case-content'),records=attachments.get(patient.id)||[];
 const section=document.createElement('section');section.className='document-section';
 const heading=document.createElement('h2');heading.textContent='Reports / X-ray files';section.append(heading);
 const summary=document.createElement('div');summary.className='document-print-list';section.append(summary);
 const form=document.createElement('form');form.className='clinical-editor document-form';
 const notice=document.createElement('p');notice.className='notice';notice.textContent='Files stay in this device’s browser. They are included in your manual backup and are not uploaded to any cloud service.';form.append(notice);
 const grid=document.createElement('div');grid.className='form-grid';form.append(grid);
 function field(caption,type){const l=document.createElement('label');l.textContent=caption;const control=document.createElement('input');control.type=type;l.append(control);grid.append(l);return control}
 const label=field('File title (e.g. CBC)','text');label.maxLength=100;label.placeholder='Report';
 const file=field('PDF / JPG / PNG (maximum 5 MB)','file');file.accept='.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
 const add=document.createElement('button');add.type='submit';add.textContent='Add fictional file';form.append(add);
 const status=document.createElement('p');status.setAttribute('role','status');form.append(status);section.append(form);box.append(section);
 function draw(){summary.replaceChildren();if(!records.length){const p=document.createElement('p');p.textContent='No files attached to this patient.';summary.append(p);return}
  for(const [i,r] of records.entries()){const row=document.createElement('div');row.className='row document-row';const text=document.createElement('span');text.textContent=`${r.title} · ${r.name} · ${r.date} · ${(r.size/1024).toFixed(0)} KB`;const open=document.createElement('a');open.href=r.url;open.target='_blank';open.rel='noopener noreferrer';open.textContent=r.type==='application/pdf'?'Open PDF':'Open image';open.setAttribute('aria-label',`${r.title} ${open.textContent}`);const download=document.createElement('a');download.href=r.url;download.download=r.name;download.textContent='Download';const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.onclick=async()=>{try{await putDemo('attachment',patient.id,records.filter((_,j)=>j!==i).map(({url,...entry})=>entry));URL.revokeObjectURL(r.url);records.splice(i,1);draw()}catch{status.textContent='Could not remove the file.'}};row.append(text,open,download,remove);summary.append(row)}
 }
 draw();getDemo('attachment',patient.id).then(saved=>{if(!saved||attachments.has(patient.id))return;for(const item of saved){if(!(item.blob instanceof Blob))continue;records.push({...item,url:URL.createObjectURL(item.blob)})}attachments.set(patient.id,records);draw()}).catch(()=>{status.textContent='Local file storage is unavailable in this browser.'});form.addEventListener('submit',async e=>{e.preventDefault();const f=file.files?.[0];if(!f){status.textContent='Select a file.';return}if(f.size>MAX_BYTES){status.textContent='The file must be no larger than 5 MB.';return}if(!['application/pdf','image/jpeg','image/png'].includes(f.type)){status.textContent='Only PDF, JPG or PNG files are accepted.';return}if(records.length>=MAX_FILES){status.textContent='Up to 20 files can be attached to a patient.';return}
  const safeName=f.name.replace(/[\r\n]/g,' ').slice(0,160),titleText=(label.value.trim()||safeName).slice(0,100),url=URL.createObjectURL(f),entry={title:titleText,name:safeName,type:f.type,size:f.size,date:todayIST(),blob:f,url};try{await putDemo('attachment',patient.id,[...records.map(({url,...item})=>item),((({url,...item})=>item)(entry))]);records.push(entry);attachments.set(patient.id,records);file.value='';label.value='';draw();status.textContent='File saved on this device.'}catch{URL.revokeObjectURL(url);status.textContent='File save failed. Check available device storage.'};
 });
});
window.addEventListener('pagehide',()=>{for(const list of attachments.values())for(const file of list)URL.revokeObjectURL(file.url)});
