import {getAuthProvider} from './auth-context.mjs?v=32';
import {syncRows,acceptCloud,allDemo} from './demo-store.mjs?v=32';
import {syncClinic} from './clinic-sync.mjs?v=32';
const section=document.createElement('section');section.className='panel';section.innerHTML='<h3>Firebase clinic sync</h3><p>Intake, examination, prescriptions, review notes, follow-ups and Panchakarma sync for Owner / Doctor. Files remain on this device. Local records are kept when a sync fails. Conflicting edits are never overwritten.</p><button id="clinic-sync" disabled>Sync clinic records</button><p id="clinic-cloud-status" role="status">Sign in through Settings to connect Firebase. New clinicRecords rules must be published.</p><button id="clinic-cloud-reload" hidden>Reload saved records</button>';
document.getElementById('settings').prepend(section);
const button=section.querySelector('#clinic-sync'),status=section.querySelector('#clinic-cloud-status'),reload=section.querySelector('#clinic-cloud-reload');let busy=false,again=false,epoch=0,timer;
async function sync(){if(busy){again=true;return}const auth=getAuthProvider(),user=auth?.current(),currentEpoch=epoch;if(!['owner','doctor'].includes(user?.role)){status.textContent='Owner / Doctor sign-in required. Student cloud access is not enabled in this version.';return}busy=true;button.disabled=true;status.textContent='Syncing clinic records…';
 try{const result=await syncClinic({auth,localRows:syncRows,ack:acceptCloud,isCurrent:()=>epoch===currentEpoch&&auth.current()?.uid===user.uid});if(epoch!==currentEpoch)return;
 status.textContent=`Cloud: ${result.uploaded} uploaded · ${result.pulled} loaded · ${result.conflicts.length} conflicts · ${result.failures.length} failed.`;
 if(result.conflicts.length)status.textContent+=' Conflicting records remain local; download a backup before resolving them.';
 if(result.failures.length)status.textContent+=' '+[...new Set(result.failures.map(f=>String(f.code).replace(/[^A-Za-z0-9_]/g,'')))].join(', ');
 const intakes=await allDemo('intake');for(const r of intakes)document.dispatchEvent(new CustomEvent('opd-added',{detail:r.value}));reload.hidden=!result.pulled;
 }catch(error){if(epoch===currentEpoch)status.textContent='Cloud sync failed: '+String(error.code||error.message).replace(/[^A-Za-z0-9_]/g,'')+'. Local records are retained. Check published clinicRecords rules and connectivity.';}
 finally{busy=false;button.disabled=!['owner','doctor'].includes(getAuthProvider()?.current()?.role);if(again){again=false;queueMicrotask(sync)}}}
button.onclick=sync;reload.onclick=()=>location.reload();window.addEventListener('opd-auth-change',()=>{epoch++;button.disabled=!['owner','doctor'].includes(getAuthProvider()?.current()?.role);if(!button.disabled)sync()});
window.addEventListener('opd-local-save',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(getAuthProvider()?.current()&&navigator.onLine)sync()},1500)});
window.addEventListener('online',()=>{if(getAuthProvider()?.current())sync()});
