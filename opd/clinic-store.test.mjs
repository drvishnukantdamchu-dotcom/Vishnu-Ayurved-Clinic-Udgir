import test from 'node:test';
import assert from 'node:assert/strict';
import {syntheticId,validateStoredRecord} from './demo-store.mjs';
test('clinic store accepts clinic IDs and excludes legacy demo records',()=>{
 assert.equal(syntheticId('VAC-OPD-20261002-12345678'),true);
 assert.equal(syntheticId('VAC-DEMO-001'),false);
 assert.equal(syntheticId('../users/admin'),false);
});
test('restore rejects mismatched identity and malformed clinical records before writes',()=>{
 const id='VAC-OPD-20261002-12345678';
 assert.equal(validateStoredRecord('intake',id,{id,name:'Test entry',visitDate:'2026-10-02'}),true);
 assert.throws(()=>validateStoredRecord('intake',id,{id:'different',name:'Test',visitDate:'2026-10-02'}),/INVALID_BACKUP/);
 assert.throws(()=>validateStoredRecord('clinical',id,{complaints:'invalid',values:{}}),/INVALID_BACKUP/);
 assert.throws(()=>validateStoredRecord('prescription',id,{drugs:[],diagnosis:3}),/INVALID_BACKUP/);
 assert.throws(()=>validateStoredRecord('review',id,{patient:{id:'different'},status:'reviewed',submittedAt:'now',note:''}),/INVALID_BACKUP/);
});
