import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const src=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const names=['calendarDayKey','dayTotals','keyDate','mondayOfKey','weeklyReport','sleepText','weeklyReportsHTML'];
const code=names.map(name=>{const i=src.indexOf('function '+name+'(');return src.slice(i,src.indexOf('\nfunction ',i+1))}).join('\n');
const s={checkins:[{date:'2026-10-12',weight:82},{date:'2026-10-14',weight:81.5}],days:{'2026-10-12':{meals:[{kcal:2000}],health:{steps:1000,sleepMin:480}},'2026-10-13':{health:{steps:0,stepsReceived:true,sleepMin:0,sleepReceived:true}},'2026-10-14':{meals:[{kcal:1000}],health:{steps:0,sleepMin:0}},'2026-10-15':{meals:[{kcal:99999}]}}};
const c={s,n:v=>Number(v)||0,today:()=> '2026-10-14',exerciseTotal:(type,date)=>date==='2026-10-12'?(type==='push'?50:5):0};vm.createContext(c);vm.runInContext(code,c);
const w=c.weeklyReport();assert.equal(w.elapsed,3);assert.equal(w.kcal,3000);assert.equal(w.average,1000);assert.equal(w.steps,500);assert.equal(w.stepsDays,2);assert.equal(w.sleep,240);assert.equal(w.sleepDays,2);assert.equal(w.weightDelta,-.5);assert.equal(w.trained,1);assert.equal(w.pull,5);assert.equal(c.weeklyReport(1).elapsed,7);assert.equal(c.weeklyReport(1).sleep,null);assert.match(c.weeklyReportsHTML(),/RESUMEN SEMANAL/);assert.equal((c.weeklyReportsHTML().match(/<article/g)||[]).length,8);
console.log('PASS: partial week, future exclusion, missing versus zero, weight change, exercise, past weeks.');
