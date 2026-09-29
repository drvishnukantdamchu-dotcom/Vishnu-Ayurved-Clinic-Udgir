import {exportDemo,importDemo} from './demo-store.mjs?v=23';
import {getAuthProvider} from './auth-context.mjs?v=23';
const settings=document.getElementById('settings');
const box=document.createElement('section');box.className='panel';
const title=document.createElement('h3');title.textContent='या डिव्हाइसवरील काल्पनिक नोंदी: बॅकअप / रिस्टोर';
const warning=document.createElement('p');warning.textContent='बॅकअप फाइलमध्ये काल्पनिक मजकूर आणि फाइल्स असतील. ती डाउनलोड करून आपल्या Google Drive मध्ये स्वतः सुरक्षित ठेवा. स्वयंचलित Drive sync नाही. खरे रुग्ण रेकॉर्ड येथे नोंदवू नका.';
const button=document.createElement('button');button.type='button';button.textContent='नमुना बॅकअप डाउनलोड करा';
const label=document.createElement('label');label.textContent='नमुना बॅकअप JSON निवडा';const input=document.createElement('input');input.type='file';input.accept='.json,application/json';label.append(input);
const restore=document.createElement('button');restore.type='button';restore.textContent='नमुना बॅकअप रिस्टोर करा';
const status=document.createElement('p');status.setAttribute('role','status');box.append(title,warning,button,label,restore,status);settings.append(box);
function owner(){if(getAuthProvider()?.current()?.role!=='owner'){status.textContent='फक्त Owner login केल्यावर बॅकअप आणि रिस्टोर चालेल.';return false}return true}
button.onclick=async()=>{if(!owner())return;try{const backup=await exportDemo();const url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`vac-opd-synthetic-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent=`${backup.records.length} काल्पनिक स्थानिक नोंदी बॅकअपमध्ये घेतल्या.`}catch{status.textContent='बॅकअप तयार झाला नाही; ब्राउझर साठवण तपासा.'}};
restore.onclick=async()=>{if(!owner())return;const file=input.files?.[0];if(!file){status.textContent='आधी JSON फाइल निवडा.';return}if(file.size>100*1024*1024){status.textContent='फाइल 100 MB पेक्षा मोठी आहे.';return}if(!confirm('या डिव्हाइसवर बॅकअपमधील समान नमुना नोंदी बदलल्या जाऊ शकतात. रिस्टोर करायचा?'))return;try{const backup=JSON.parse(await file.text());const count=await importDemo(backup);status.textContent=`${count} काल्पनिक नोंदी रिस्टोर झाल्या. पान refresh करा.`}catch{status.textContent='अवैध बॅकअप किंवा रिस्टोर अयशस्वी. कोणतीही खरी रुग्ण माहिती आयात करू नका.'}};
