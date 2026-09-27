import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuth, acceptedRole, permissions} from './auth.mjs';
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
