import {todayIST,validatePatient,searchPatients} from './patient-model.mjs';
import './clinical.mjs';
const section=document.getElementById('patients');
document.querySelector('label[for="search"]').textContent='नाव, Patient ID, गाव किंवा मोबाइल';
const panel=document.createElement('details');panel.className='panel';
panel.innerHTML=`<summary>＋ नवीन नमुना रुग्ण नोंदवा</summary><p class="notice">फक्त काल्पनिक माहिती वापरा. या नोंदी याच टॅबमध्ये तात्पुरत्या राहतील; refresh केल्यावर मिटतील. Cloud save बंद आहे.</p>
<form id="registration"><div class="form-grid">
<label>पूर्ण नाव *<input name="name" required maxlength="100" autocomplete="off" placeholder="नमुना रुग्ण ड"></label>
<label>वय (वर्षे)<input name="age" type="number" min="0" max="120" step="1"></label>
<label>लिंग<select name="gender"><option>नोंद नाही</option><option>स्त्री</option><option>पुरुष</option><option>इतर</option></select></label>
<label>गाव<input name="village" maxlength="100"></label>
<label>मोबाइल — ऐच्छिक<input name="mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="off"></label>
<label>मूळ भेटीची तारीख *<input name="visitDate" type="date" required></label></div>
<label><input name="demo" type="checkbox" required style="width:auto"> ही काल्पनिक चाचणी नोंद आहे.</label>
<button type="submit">तात्पुरती नमुना नोंद जोडा</button><p id="registration-status" role="status"></p></form>`;
section.prepend(panel);
const form=panel.querySelector('form'),date=form.elements.visitDate;date.value=todayIST();date.max=todayIST();
const filters=document.createElement('div');filters.className='form-grid';filters.innerHTML='<label>तारखेपासून<input id="date-from" type="date"></label><label>तारखेपर्यंत<input id="date-to" type="date"></label>';
document.getElementById('search').after(filters);
const list=[];const results=document.getElementById('results');
document.addEventListener('opd-samples-ready',e=>{for(const p of e.detail)if(!list.some(x=>x.id===p.id))list.push(p);update()});
function update(){const from=document.getElementById('date-from').value,to=document.getElementById('date-to').value;if(from&&to&&from>to){results.textContent='सुरुवातीची तारीख शेवटच्या तारखेपूर्वी असावी.';return}document.dispatchEvent(new CustomEvent('opd-filtered',{detail:searchPatients(list,document.getElementById('search').value,from,to)}))}
for(const id of ['search','date-from','date-to'])document.getElementById(id).addEventListener('input',update);
form.addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(form));for(const k of ['name','mobile','village'])p[k]=p[k].trim();const error=validatePatient(p);const status=document.getElementById('registration-status');if(error){status.textContent=error;return}
 const duplicate=list.find(x=>x.name===p.name&&x.mobile===p.mobile&&x.village===p.village);if(duplicate){status.textContent=`अशी नमुना नोंद आधीच आहे: ${duplicate.id}`;return}
 p.id='VAC-DEMO-'+crypto.randomUUID();p.type='नवीन';p.enteredAt=new Date().toISOString();list.push(p);document.dispatchEvent(new CustomEvent('opd-added',{detail:p}));status.textContent=`नमुना नोंद जोडली: ${p.id}. भेटीची तारीख आणि प्रत्यक्ष नोंदणीची वेळ स्वतंत्र ठेवली आहे.`;form.reset();date.value=todayIST();update();
});
document.dispatchEvent(new Event('opd-request-samples'));
