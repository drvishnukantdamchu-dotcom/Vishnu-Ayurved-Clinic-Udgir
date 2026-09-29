import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syncIntakes} from './intake-sync.mjs';

test('failed intake stays queued and retries with the same ID after reload',async()=>{
  const rows=new Map([['VAC-DEMO-1',{id:'VAC-DEMO-1',createdBy:'a'}]]);
  const ids=[];let offline=true;
  const auth={current:()=>({uid:'a'}),listPatientIntakes:async()=>[],savePatientIntake:async(row,options)=>{
    assert.equal(options.createOnly,true);ids.push(row.id);
    if(offline)throw new Error('NETWORK_ERROR');return row;
  }};
  const run=()=>syncIntakes({auth,pending:async()=>[...rows.values()],remove:async id=>rows.delete(id)});
  assert.equal((await run()).failures.length,1);assert.equal(rows.size,1);
  offline=false;assert.equal((await run()).uploaded,1);assert.equal(rows.size,0);
  assert.deepEqual(ids,['VAC-DEMO-1','VAC-DEMO-1']);
});
test('another account cannot upload pending records belonging to the first account',async()=>{
  const auth={current:()=>({uid:'b'}),listPatientIntakes:async()=>[],savePatientIntake:()=>assert.fail('wrong account upload')};
  const result=await syncIntakes({auth,pending:async()=>[{id:'VAC-DEMO-1',createdBy:'a'}],remove:()=>assert.fail('wrong account removal')});
  assert.equal(result.uploaded,0);
});
test('logout during upload retains the pending record and does not display the response',async()=>{
  let user={uid:'a'};
  const auth={current:()=>user,savePatientIntake:async row=>{user=null;return row}};
  await assert.rejects(syncIntakes({auth,pending:async()=>[{id:'VAC-DEMO-1',createdBy:'a'}],remove:()=>assert.fail('must retain'),onSaved:()=>assert.fail('stale response')}),/SESSION_CHANGED/);
});
test('one denied record does not block the next pending record',async()=>{
  const removed=[];
  const auth={current:()=>({uid:'a'}),listPatientIntakes:async()=>[],savePatientIntake:async row=>{if(row.id==='VAC-DEMO-1')throw new Error('PERMISSION_DENIED');return row}};
  const result=await syncIntakes({auth,pending:async()=>[1,2].map(n=>({id:`VAC-DEMO-${n}`,createdBy:'a'})),remove:async id=>removed.push(id)});
  assert.deepEqual(removed,['VAC-DEMO-2']);assert.equal(result.uploaded,1);assert.equal(result.failures.length,1);
});
