export function todayIST(now=new Date()) {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function validatePatient(p,today=todayIST()) {
 if(!p.name?.trim() || p.name.trim().length>100)return 'Name is required (maximum 100 characters).';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.visitDate)||!Number.isFinite(Date.parse(p.visitDate))||new Date(p.visitDate).toISOString().slice(0,10)!==p.visitDate||p.visitDate>today)return 'Choose a valid visit date, no later than today.';
 if(p.age!==''&&(!/^\d+$/.test(p.age)||Number(p.age)>120))return 'Enter a whole-number age from 0 to 120.';
 if(!['स्त्री','पुरुष','इतर','नोंद नाही'].includes(p.gender))return 'Select a gender option.';
 if(p.mobile&&!/^[6-9]\d{9}$/.test(p.mobile))return 'Enter a valid 10-digit Indian mobile number or leave blank.';
 return '';
}
export function searchPatients(list,query='',from='',to='') {
 const q=query.normalize('NFKC').trim().toLocaleLowerCase();
 return list.filter(p=>(!from||p.visitDate>=from)&&(!to||p.visitDate<=to)&&[p.name,p.id,p.village,p.mobile].some(v=>String(v||'').normalize('NFKC').toLocaleLowerCase().includes(q)));
}
