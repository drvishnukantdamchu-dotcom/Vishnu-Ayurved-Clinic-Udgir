import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuth, acceptedRole, permissions, firebaseErrorMessage} from './auth.mjs';
const doc=(role,active=true)=>({fields:{role:{stringValue:role},active:{booleanValue:active}}});
test('unknown, missing and inactive roles denied',()=>{
 for(const d of [null,{},doc('admin'),doc('owner',false)]) assert.equal(acceptedRole(d),null);
});
test('students cannot approve, export, manage users or restore',()=>{
 assert.deepEqual(permissions('student'),{enterDraft:true,approveClinical:false,manageUsers:false,exportAll:false,restoreBackup:false});
 assert.equal(permissions('owner').restoreBackup,true);
 assert.equal(permissions('doctor').manageUsers,false);
});
test('unconfigured login makes no network request',async()=>{
 const a=createAuth({enabled:false},()=>{throw Error('must not fetch')});
 await assert.rejects(a.login('x@y.com','x'),/NOT_CONFIGURED/);
 assert.equal(a.current(),null);
});
test('owner email cannot override server-assigned student role',async()=>{
 const responses=[{localId:'student-uid',idToken:'test-token'},doc('student')];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async()=>({ok:true,json:async()=>responses.shift()}));
 const user=await a.login('drvishnukantdamchu@gmail.com','test');
 assert.equal(user.role,'student');a.logout();assert.equal(a.current(),null);
});
test('inactive account denied after authentication',async()=>{
 const responses=[{localId:'uid',idToken:'test-token'},doc('owner',false)];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async()=>({ok:true,json:async()=>responses.shift()}));
 await assert.rejects(a.login('test@example.com','test'),/ACCESS_DENIED/);
 assert.equal(a.current(),null);
});
test('network failure leaves no session',async()=>{
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async()=>({ok:false}));
 await assert.rejects(a.login('test@example.com','test'));
 assert.equal(a.current(),null);
});
test('clinical sync writes only synthetic patient intake with bearer auth',async()=>{
 const calls=[];const responses=[{localId:'owner-uid',idToken:'session-token',refreshToken:'refresh',expiresIn:'3600'},doc('owner'),{name:'projects/test/databases/(default)/documents/patientIntakes/VAC-DEMO-1'}];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}});
 await a.login('owner@example.com','secret');
 await assert.rejects(a.savePatientIntake({id:'REAL-1',name:'Real patient'}),/SYNTHETIC_ONLY/);
 const saved=await a.savePatientIntake({id:'VAC-DEMO-1',name:'Synthetic patient',type:'नवीन',visitDate:'2026-09-28'});
 assert.equal(saved.id,'VAC-DEMO-1');assert.match(calls[2].url,/patientIntakes\/VAC-DEMO-1$/);assert.equal(calls[2].options.headers.Authorization,'Bearer session-token');
 const fields=JSON.parse(calls[2].options.body).fields;assert.equal(fields.name.stringValue,'Synthetic patient');assert.equal(fields.createdBy.stringValue,'owner-uid');
});
test('student Firestore list query is constrained to authenticated UID',async()=>{
 const calls=[];const responses=[{localId:'student-uid',idToken:'token',refreshToken:'refresh'},doc('student'),[]];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}});
 await a.login('student@example.com','secret');assert.deepEqual(await a.listPatientIntakes(),[]);
 assert.match(calls[2].url,/\/documents:runQuery$/);
 const query=JSON.parse(calls[2].options.body).structuredQuery;
 assert.equal(query.where.fieldFilter.field.fieldPath,'createdBy');assert.equal(query.where.fieldFilter.value.stringValue,'student-uid');
});
test('synthetic clinical draft uses authenticated patient document and immutable author',async()=>{
 const calls=[];const responses=[{localId:'doctor-uid',idToken:'token',refreshToken:'refresh'},doc('doctor'),{fields:{id:{stringValue:'VAC-DEMO-1'},createdBy:{stringValue:'student-uid'},payload:{mapValue:{fields:{complaints:{arrayValue:{values:[]}},values:{mapValue:{fields:{}}}}}},updatedAt:{stringValue:'2026-09-28T00:00:00Z'}}},{name:'projects/test/databases/(default)/documents/demoClinical/VAC-DEMO-1'}];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}});
 await a.login('doctor@example.com','secret');await assert.rejects(a.saveDemoClinical('REAL-1',{complaints:[],values:{}}),/SYNTHETIC_ONLY/);
 const saved=await a.saveDemoClinical('VAC-DEMO-1',{complaints:[{text:'demo',duration:'',severity:''}],values:{bp:'120/80'}});
 assert.equal(saved.createdBy,'student-uid');assert.match(calls[2].url,/demoClinical\/VAC-DEMO-1$/);assert.equal(calls[3].options.headers.Authorization,'Bearer token');
 const written=JSON.parse(calls[3].options.body).fields;assert.equal(written.createdBy.stringValue,'student-uid');assert.equal(written.payload.mapValue.fields.values.mapValue.fields.bp.stringValue,'120/80');
});
test('students cannot read or write prescriptions in the client adapter',async()=>{
 const calls=[];const responses=[{localId:'student-uid',idToken:'token'},doc('student')];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}});
 await a.login('student@example.com','secret');
 await assert.rejects(a.loadDemoPrescription('VAC-DEMO-1'),/ROLE_DENIED/);
 await assert.rejects(a.saveDemoPrescription('VAC-DEMO-1',{diagnosis:'',advice:'',followup:'',drugs:[]}),/ROLE_DENIED/);
 assert.equal(calls.length,2);
});
test('doctor saves prescription only to synthetic prescription path',async()=>{
 const calls=[];const responses=[{localId:'doctor-uid',idToken:'token'},doc('doctor'),null,{name:'projects/test/databases/(default)/documents/demoPrescriptions/VAC-DEMO-1'}];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});const payload=responses.shift();return payload===null?{ok:false,status:404,json:async()=>({})}:{ok:true,json:async()=>payload}});
 await a.login('doctor@example.com','secret');
 const saved=await a.saveDemoPrescription('VAC-DEMO-1',{diagnosis:'sample',advice:'',followup:'',drugs:[{name:'sample tablet',form:'वटी',dose:'1 गोळी',times:'संध्याकाळ',food:'जेवणानंतर',vehicle:'',duration:'5 दिवस',site:''}]});
 assert.equal(saved.createdBy,'doctor-uid');
 assert.match(calls.at(-1).url,/demoPrescriptions\/VAC-DEMO-1$/);
 assert.equal(JSON.parse(calls.at(-1).options.body).fields.payload.mapValue.fields.drugs.arrayValue.values.length,1);
});

test('student case draft sync creates without a forbidden read, authored to signed-in UID',async()=>{
 const calls=[];const responses=[{localId:'student-uid',idToken:'token'},doc('student'),{name:'projects/test/databases/(default)/documents/demoClinical/VAC-DEMO-NEW'}];
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}});
 await a.login('student@example.com','secret');
 const saved=await a.saveDemoClinical('VAC-DEMO-NEW',{complaints:[],values:{bp:'120/80'}});
 assert.equal(saved.createdBy,'student-uid');
 assert.match(calls.at(-1).url,/demoClinical\/VAC-DEMO-NEW$/);
 assert.equal(calls.length,3,'only login, role lookup, and PATCH; no denied draft GET');
 assert.equal(JSON.parse(calls.at(-1).options.body).fields.createdBy.stringValue,'student-uid');
});
test('Firebase REST permission errors are surfaced as useful safe diagnostics',async()=>{
 const a=createAuth({enabled:true,apiKey:'test',projectId:'test'},async()=>({ok:false,status:403,json:async()=>({error:{status:'PERMISSION_DENIED',message:'private body omitted'}})}));
 await assert.rejects(a.login('x@example.com','secret'),e=>e.code==='PERMISSION_DENIED'&&!String(e).includes('private body'));
 assert.match(firebaseErrorMessage(Object.assign(new Error('PERMISSION_DENIED'),{code:'PERMISSION_DENIED'})),/Rules.*UID/);
});
