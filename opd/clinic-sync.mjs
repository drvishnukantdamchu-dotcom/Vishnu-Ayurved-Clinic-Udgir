// Writes use Firestore update-time preconditions; conflicts never overwrite records.
export async function syncClinic({auth,localRows,ack,isCurrent=()=>true}){
 const user=auth.current();if(!['owner','doctor'].includes(user?.role))throw new Error('ROLE_DENIED');
 const remote=await auth.listClinicRecords();if(!isCurrent())throw new Error('SESSION_CHANGED');
 const cloud=new Map(remote.map(r=>[`${r.kind}:${r.id}`,r]));let uploaded=0,pulled=0;const conflicts=[],failures=[];
 for(const row of await localRows()){
  if(!isCurrent())throw new Error('SESSION_CHANGED');
  const k=`${row.kind}:${row.id}`,existing=cloud.get(k);
  if(!row.dirty&&row.cloudRevision)continue;
  if(existing&&(existing.revision!==row.cloudRevision)){
   if(existing.payload===JSON.stringify(row.value??null)&&existing.deleted===Boolean(row.deleted)){await ack(existing,row.updatedAt);continue;}
   conflicts.push(k);continue;
  }
  try{const saved=await auth.saveClinicRecord(row);if(!isCurrent())throw new Error('SESSION_CHANGED');await ack(saved,row.updatedAt);cloud.set(k,saved);uploaded++;}
  catch(error){if(!isCurrent())throw error;failures.push({key:k,code:error.code||error.message});}
 }
 for(const row of cloud.values()){if(!isCurrent())throw new Error('SESSION_CHANGED');if(await ack(row))pulled++;}
 return {uploaded,pulled,conflicts,failures};
}
