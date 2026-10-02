import {createAuth, permissions, firebaseErrorMessage} from './auth.mjs?v=33';
import {setAuthProvider} from './auth-context.mjs?v=33';
const panel=document.createElement('section');
panel.className='panel';
panel.innerHTML=`<h2>Account sign-in</h2>
<p id="auth-status" role="status">Checking Firebase configuration…</p>
<form id="auth-form"><label for="auth-email">Email address</label><input id="auth-email" type="email" autocomplete="username" required disabled>
<label for="auth-password">Password</label><input id="auth-password" type="password" autocomplete="current-password" required disabled>
<div class="actions"><button id="auth-submit" type="submit" disabled>Sign in</button><button id="auth-out" type="button" hidden>Sign out</button></div></form>
<p id="auth-role"></p><p class="muted">Clinic text records sync for Owner / Doctor after publishing clinicRecords rules. Files stay local. This shared device retains offline records after sign-out; student access is not enabled.</p>`;
document.getElementById('settings').prepend(panel);
const status=panel.querySelector('#auth-status'), form=panel.querySelector('form');
const controls=[...form.querySelectorAll('input'),panel.querySelector('#auth-submit')];
const out=panel.querySelector('#auth-out'),roleLabel=panel.querySelector('#auth-role');
let auth;
function reset(message){auth?.logout();setAuthProvider(auth||null);window.dispatchEvent(new CustomEvent('opd-auth-change',{detail:null}));form.reset();roleLabel.textContent='';out.hidden=true;controls.forEach(e=>e.disabled=!auth?.configured);status.textContent=message;}
try {
 const response=await fetch('./firebase-config.json',{cache:'no-store'});
 if(!response.ok)throw new Error('CONFIG');
 auth=createAuth(await response.json());
 reset(auth.configured?'Firebase configured. Sign in as Owner / Doctor to connect clinic records.':'Firebase is not configured. Sign-in is disabled.');
}catch{reset('Configuration unavailable. Sign-in is disabled.');}
form.addEventListener('submit',async e=>{
 e.preventDefault();controls.forEach(c=>c.disabled=true);status.textContent='Checking identity and permissions…';
 try{
  const user=await auth.login(panel.querySelector('#auth-email').value,panel.querySelector('#auth-password').value);
  setAuthProvider(auth);window.dispatchEvent(new CustomEvent('opd-auth-change',{detail:user}));
  const p=permissions(user.role);
  status.textContent='Identity verified. Clinic cloud sync requires published clinicRecords rules.';
  roleLabel.textContent=`Role: ${user.role} · Clinical approval: ${p.approveClinical?'Yes':'No'} · User management: ${p.manageUsers?'Yes':'No'}`;
  form.reset();out.hidden=false;
 }catch(error){reset('Sign-in failed. '+firebaseErrorMessage(error));}
 finally{panel.querySelector('#auth-password').value='';}
});
out.onclick=()=>{reset('Signed out.');location.reload()};
setInterval(()=>{if(!out.hidden&&!auth?.current()){reset('Session expired. Sign in again.');location.reload()}},15000);
