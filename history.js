import {historyChart} from './history-chart.js';
import {database} from './data.js';
import {might} from './engine.js';
export function rosterSignature(account){return JSON.stringify(database.map(v=>[v.name,Number(account.levels?.[v.name]||0)]));}
export function currentMight(account){return Math.round(database.reduce((sum,v)=>sum+Math.round(might(v.rarity,account.levels?.[v.name]||0)*10),0)/10);}
export function normalizeHistory(history){if(!Array.isArray(history))return [];return history.filter(p=>p&&typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))&&Number.isSafeInteger(p.might)&&p.might>=0&&Number.isSafeInteger(p.owned)&&p.owned>=0&&p.owned<=database.length).map(p=>({at:p.at,might:p.might,owned:p.owned})).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));}
export function recordMight(account,now=new Date().toISOString()){
 account.mightHistory=normalizeHistory(account.mightHistory);
 const signature=rosterSignature(account),owned=database.filter(v=>account.levels?.[v.name]>0).length;
 if(!owned&&!account.mightHistory.length){account.historyRosterSignature=signature;return false;}
 if(account.mightHistory.length&&account.historyRosterSignature===signature)return false;
 const last=account.mightHistory.at(-1),snapshot={at:now,might:currentMight(account),owned};
 // A legacy backup may contain history without the signature. Do not manufacture a point.
 if(!last||last.might!==snapshot.might||last.owned!==owned)account.mightHistory.push(snapshot);
 account.historyRosterSignature=signature;return !last||last.might!==snapshot.might||last.owned!==owned;
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n).toLocaleString();
const date=at=>new Date(at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
export function historyHTML(account){
 const points=normalizeHistory(account.mightHistory);
 if(!points.length)return '<section class="card might-history"><span class="eyebrow">RECORDED GROWTH</span><h3>Might history</h3><p>Enter or import your first roster to begin tracking. Each saved roster change adds a recorded might value.</p></section>';
 const first=points[0],last=points.at(-1),change=last.might-first.might,percentage=first.might?change/first.might*100:null;
 return `<section class="card might-history"><div class="heading"><div><span class="eyebrow">RECORDED GROWTH</span><h3>Might history</h3><small>Tracking ${escape(account.name)} since ${date(first.at)}</small></div><span class="context-chip">${points.length} saved snapshots</span></div><div class="history-metrics"><div><small>First recorded</small><strong>${number(first.might)}</strong></div><div><small>Current recorded</small><strong>${number(last.might)}</strong></div><div><small>Change since tracking began</small><strong class="${change>=0?'history-positive':'history-negative'}">${change>=0?'+':''}${number(change)}</strong><small>${percentage===null?'':`${percentage>=0?'+':''}${percentage.toFixed(1)}%`}</small></div></div>${historyChart(points.map(p=>({at:p.at,value:p.might})),{label:account.name+' recorded might growth',delta:true,id:'might-chart'})}<p class="help">Recorded roster values, including newly owned cards and corrections. Projected plans and resource edits do not count. Earlier unrecorded might cannot be recovered.</p><details class="history-records"><summary>View exact saved values</summary><div class="tablewrap"><table><thead><tr><th>Saved</th><th>Might</th><th>Owned</th><th>Change from first</th></tr></thead><tbody>${points.slice().reverse().map(p=>`<tr><td>${escape(new Date(p.at).toLocaleString())}</td><td>${number(p.might)}</td><td>${p.owned}</td><td>${p.might-first.might>=0?'+':''}${number(p.might-first.might)}</td></tr>`).join('')}</tbody></table></div></details></section>`;
}
