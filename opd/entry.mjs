import {createAuth,firebaseErrorMessage} from './auth.mjs?v=34';
import {setAuthProvider} from './auth-context.mjs?v=34';
const form=document.getElementById('entry-login'),status=document.getElementById('entry-status');let auth;
try{const r=await fetch('./firebase-config.json',{cache:'no-store'});auth=createAuth(await r.json());if(!auth.configured)throw new Error();}catch{status.textContent='Firebase configuration unavailable. Sign-in is disabled.';form.querySelector('button').disabled=true;}
form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='Checking account…';
try{const user=await auth.login(document.getElementById('entry-email').value,document.getElementById('entry-password').value);if(!['owner','doctor'].includes(user.role)){auth.logout();status.textContent='Use Student data-entry login for a student account.';button.disabled=false;return;}
setAuthProvider(auth);await import('./app.js?v=34');await import('./registration.mjs?v=34');await import('./cloud.mjs?v=34');document.body.classList.add('authenticated');
const account=document.createElement('section');account.className='panel';const text=document.createElement('p');text.textContent='Signed in as '+user.role;const out=document.createElement('button');out.textContent='Sign out';out.onclick=()=>{auth.logout();location.reload()};account.append(text,out);document.getElementById('settings').prepend(account);window.dispatchEvent(new CustomEvent('opd-auth-change',{detail:user}));
}catch(error){status.textContent=firebaseErrorMessage(error);button.disabled=false;}finally{document.getElementById('entry-password').value='';}};
