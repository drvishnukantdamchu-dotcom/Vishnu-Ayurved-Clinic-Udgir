export function todayIST(now=new Date()) {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
}
export function validatePatient(p,today=todayIST()) {
 if(!p.name?.trim() || p.name.trim().length>100)return 'नाव आवश्यक आहे; कमाल १०० अक्षरे.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.visitDate)||!Number.isFinite(Date.parse(p.visitDate))||new Date(p.visitDate).toISOString().slice(0,10)!==p.visitDate||p.visitDate>today)return 'भेटीची योग्य तारीख निवडा; भविष्यातील तारीख नको.';
 if(p.age!==''&&(!/^\d+$/.test(p.age)||Number(p.age)>120))return 'वय ० ते १२० दरम्यान पूर्ण अंकात भरा.';
 if(!['स्त्री','पुरुष','इतर','नोंद नाही'].includes(p.gender))return 'लिंग पर्याय निवडा.';
 if(p.mobile&&!/^[6-9]\d{9}$/.test(p.mobile))return 'भारतीय मोबाइल क्रमांक १० अंकांचा असावा किंवा रिकामा ठेवा.';
 return '';
}
export function searchPatients(list,query='',from='',to='') {
 const q=query.normalize('NFKC').trim().toLocaleLowerCase();
 return list.filter(p=>(!from||p.visitDate>=from)&&(!to||p.visitDate<=to)&&[p.name,p.id,p.village,p.mobile].some(v=>String(v||'').normalize('NFKC').toLocaleLowerCase().includes(q)));
}
