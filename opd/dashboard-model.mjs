export function dashboardMetrics(patients,prescriptions=[],reviews=[],followups=[],month='',today=''){
 const active=patients.filter(p=>p.archived!==true),ids=new Set(active.map(p=>p.id));
 const period=active.filter(p=>!month||String(p.visitDate||'').startsWith(month+'-'));
 const rx=new Map(prescriptions.filter(r=>ids.has(r.id)).map(r=>[r.id,r.value]));
 const rv=new Map(reviews.filter(r=>ids.has(r.id)).map(r=>[r.id,r.value]));
 const diagnoses=new Map();for(const p of period){const raw=rx.get(p.id)?.diagnosis?.trim();const labels=raw?[...new Set(raw.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean))]:['Not recorded'];for(const label of labels)diagnoses.set(label,(diagnoses.get(label)||0)+1)}
 const daily=new Map();for(const p of period)if(p.visitDate)daily.set(p.visitDate,(daily.get(p.visitDate)||0)+1);
 const status={reviewed:0,pending:0,noPrescription:0};for(const p of period){if(rv.get(p.id)?.status==='reviewed')status.reviewed++;else status.pending++;if(!rx.has(p.id))status.noPrescription++;}
 return {total:active.length,today:active.filter(p=>p.visitDate===today).length,period:period.length,newPatients:period.filter(p=>p.type==='नवीन').length,followupIntakes:period.filter(p=>p.type==='फॉलो-अप').length,followupsDue:followups.filter(r=>ids.has(r.id)&&!r.value?.done&&/^\d{4}-\d{2}-\d{2}$/.test(r.value?.date||'')&&r.value.date<=today).length,status,daily:[...daily].sort(([a],[b])=>a.localeCompare(b)),diagnoses:[...diagnoses].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))};
}
