import test from 'node:test';
import assert from 'node:assert/strict';
import {monthRange,reportRows,reportCsv} from './report-model.mjs';
test('month filters include leap day and December boundary',()=>{
 assert.deepEqual(monthRange('2024-02'),{from:'2024-02-01',to:'2024-02-29'});
 assert.equal(monthRange('2025-02').to,'2025-02-28');
 assert.equal(monthRange('2026-12').to,'2026-12-31');
 assert.deepEqual(monthRange('2026-13'),{from:'',to:''});
});
const data=[{id:'2',name:'B',visitDate:'2026-09-30',type:'नवीन',mobile:'9000000000'},
 {id:'1',name:'A',visitDate:'2026-09-01',type:'नवीन'},
 {id:'3',name:'C',visitDate:'2026-08-31'}, {id:'4',name:'D'}];
test('report excludes undated and out-of-range rows and sorts exported rows',()=>{
 assert.deepEqual(reportRows(data,monthRange('2026-09')).map(p=>p.id),['1','2']);
 assert.deepEqual(reportRows(data,{from:'2026-10-01',to:'2026-09-01'}),[]);
 assert.deepEqual(reportRows(data,{query:'  900000  '}).map(p=>p.id),['2']);
});
test('CSV neutralizes formulas and preserves quotes, Marathi and leading zeros',()=>{
 const csv=reportCsv([{name:' =HYPERLINK("x")',village:'उदगीर',mobile:'001234'}]);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes('"\' =HYPERLINK(""x"")"'));
 assert.ok(csv.includes('"उदगीर"'));assert.ok(csv.includes('"001234"'));
});
