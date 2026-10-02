import {searchPatients} from './patient-model.mjs?v=30';
export function monthRange(value) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))return {from:'',to:''};
  const [year,month]=value.split('-').map(Number);
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  return {from:`${value}-01`,to:`${value}-${days}`};
}
export function reportRows(patients,{from='',to='',type='',query=''}={}) {
  if(from&&to&&from>to)return [];
  return searchPatients(patients,query,from,to)
    .filter(p=>p.visitDate&&(!type||p.type===type))
    .sort((a,b)=>a.visitDate.localeCompare(b.visitDate)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function reportCsv(rows) {
  const cell=value=>{
    let text=String(value??'');
    // Quoting alone does not prevent spreadsheet formula execution.
    if(/^[\s\uFEFF]*[=+@-]/u.test(text))text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  return '\uFEFF'+[['Date','Patient name','Patient ID','Type','Village','Mobile'],
    ...rows.map(p=>[p.visitDate,p.name,p.id,({'नवीन':'New','फॉलो-अप':'Follow-up'})[p.type]||p.type,p.village,p.mobile])]
    .map(row=>row.map(cell).join(',')).join('\r\n');
}
