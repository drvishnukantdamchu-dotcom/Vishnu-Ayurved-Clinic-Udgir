// Durable pending intakes are assigned to the submitting user, never the next login.
export async function syncIntakes({auth, pending, remove, onSaved=()=>{}, isCurrent=()=>true}) {
  const user=auth.current();
  if(!user)throw new Error('SESSION_EXPIRED');
  const check=()=>{
    if(!isCurrent()||auth.current()?.uid!==user.uid)throw new Error('SESSION_CHANGED');
  };
  const rows=await pending();
  check();
  const failures=[];let uploaded=0;
  for(const row of rows){
    check();
    if(row.createdBy!==user.uid)continue;
    try{
      const saved=await auth.savePatientIntake(row,{createOnly:true});
      check();
      await remove(row.id);
      check();
      onSaved(saved);uploaded++;
    }catch(error){
      check();
      failures.push({id:row.id,code:error.code||error.message||'UNKNOWN_ERROR'});
    }
  }
  const remote=await auth.listPatientIntakes();
  check();
  return {uploaded,remote,failures};
}
