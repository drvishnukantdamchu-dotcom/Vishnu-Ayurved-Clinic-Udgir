import {test} from 'node:test';import assert from 'node:assert/strict';import {todayIST,validatePatient,searchPatients} from './patient-model.mjs';
const p={name:'नमुना',age:'32',gender:'पुरुष',mobile:'',visitDate:'2026-09-27',village:'उदगीर',id:'DEMO-1'};
test('IST date crosses midnight correctly',()=>assert.equal(todayIST(new Date('2026-09-26T20:00:00Z')),'2026-09-27'));
test('historical visits valid; invalid and future dates rejected',()=>{assert.equal(validatePatient(p,'2026-09-28'),'');for(const visitDate of ['2026-02-30','2027-01-01','bad'])assert.ok(validatePatient({...p,visitDate},'2026-09-28'))});
test('age and phone validation',()=>{for(const age of ['-1','121','2.5'])assert.ok(validatePatient({...p,age},'2026-09-28'));assert.ok(validatePatient({...p,mobile:'123'},'2026-09-28'))});
test('combined search and inclusive date range',()=>{assert.equal(searchPatients([p],'उदगीर','2026-09-27','2026-09-27').length,1);assert.equal(searchPatients([p],'demo-1').length,1);assert.equal(searchPatients([p],'','2026-09-28','').length,0)});
