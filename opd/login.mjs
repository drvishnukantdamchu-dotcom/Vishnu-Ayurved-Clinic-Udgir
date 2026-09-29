import {createAuth, permissions, firebaseErrorMessage} from './auth.mjs?v=22';
import {setAuthProvider} from './auth-context.mjs?v=22';
const panel=document.createElement('section');
panel.className='panel';
panel.innerHTML=`<h2>लॉगिन जोडणी · टप्पा २</h2>
<p id="auth-status" role="status">Firebase configuration तपासत आहे…</p>
<form id="auth-form"><label for="auth-email">वापरकर्त्याचा ईमेल</label><input id="auth-email" type="email" autocomplete="username" required disabled>
<label for="auth-password">पासवर्ड</label><input id="auth-password" type="password" autocomplete="current-password" required disabled>
<div class="actions"><button id="auth-submit" type="submit" disabled>लॉगिन तपासा</button><button id="auth-out" type="button" hidden>लॉगआउट</button></div></form>
<p id="auth-role"></p><p class="muted">या टप्प्यात Cloudमध्ये काल्पनिक Intake व केस-टेकिंग sync होतात. प्रिस्क्रिप्शन फक्त Owner/Doctor sync करू शकतात; विद्यार्थी नाही. फाइल्स व पंचकर्म स्थानिकच. स्वतः नोंदणी करून Admin अधिकार मिळत नाहीत.</p>`;
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
 reset(auth.configured?'Firebase तयार आहे. लॉगिननंतर काल्पनिक Intake व तपासणी sync करता येईल; प्रिस्क्रिप्शन फक्त Owner/Doctor साठी.':'Firebase project जोडलेला नाही. लॉगिन सध्या बंद आहे.');
}catch{reset('Configuration उपलब्ध नाही. सुरक्षिततेसाठी लॉगिन बंद आहे.');}
form.addEventListener('submit',async e=>{
 e.preventDefault();controls.forEach(c=>c.disabled=true);status.textContent='ओळख व परवानगी तपासत आहे…';
 try{
  const user=await auth.login(panel.querySelector('#auth-email').value,panel.querySelector('#auth-password').value);
  setAuthProvider(auth);window.dispatchEvent(new CustomEvent('opd-auth-change',{detail:user}));
  const p=permissions(user.role);
  status.textContent='ओळख पडताळली. हा अजून demo workspace आहे.';
  roleLabel.textContent=`भूमिका: ${user.role} · Clinical approval: ${p.approveClinical?'हो':'नाही'} · User management: ${p.manageUsers?'हो':'नाही'}`;
  form.reset();out.hidden=false;
 }catch(error){reset('लॉगिन झाले नाही. '+firebaseErrorMessage(error));}
 finally{panel.querySelector('#auth-password').value='';}
});
out.onclick=()=>reset('लॉगआउट झाले.');
setInterval(()=>{if(!out.hidden&&!auth?.current())reset('सत्र संपले. पुन्हा लॉगिन करा.');},15000);
