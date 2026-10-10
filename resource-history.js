import {keys} from './engine.js';
import {historyChart} from './history-chart.js';
export const resourceHistoryLabels={pe:'Purple Essence',Order:'Order Jewels',Nature:'Nature Jewels',Chaos:'Chaos Jewels',regatta:'Regatta Tickets',chariot:'Chariot Tickets'};
const colors={pe:'#c49bff',Order:'#86b7ff',Nature:'#a4d984',Chaos:'#ff91ab',regatta:'#f5aa4e',chariot:'#f5aa4e'};
const fmt=n=>Number(n).toLocaleString(),signed=n=>(n>=0?'+':'')+fmt(n),date=at=>new Date(at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
export function normalizeResourceHistory(history){return Array.isArray(history)?history.filter(p=>p&&typeof p.at==='string'&&Number.isFinite(Date.parse(p.at))&&p.resources&&keys.every(k=>Number.isSafeInteger(p.resources[k])&&p.resources[k]>=0)).map(p=>({at:p.at,resources:Object.fromEntries(keys.map(k=>[k,p.resources[k]]))})).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)):[];}
export function recordResources(account,now=new Date().toISOString()){
 account.resourceHistory=normalizeResourceHistory(account.resourceHistory);
 const resources=Object.fromEntries(keys.map(k=>[k,account.resources[k]])),last=account.resourceHistory.at(-1);
 if(!keys.every(k=>Number.isSafeInteger(resources[k])&&resources[k]>=0))return false;
 if(!last&&!account.resourcesUpdatedAt&&!keys.some(k=>resources[k]>0))return false;
 if(last&&keys.every(k=>last.resources[k]===resources[k]))return false;
 account.resourceHistory.push({at:now,resources});return true;
}
// Compare the current check-in with a recorded check-in at/before seven days ago.
// Never interpolate unrecorded balances or relabel positive changes as gross earnings.
export function weeklyResourceChange(history,now=new Date().toISOString()){
 const points=normalizeResourceHistory(history);if(!points.length)return null;
 const cutoff=Date.parse(now)-7*86400000,current=points.at(-1),baseline=points.filter(p=>Date.parse(p.at)<=cutoff).at(-1)||points[0];
 return {current,baseline,stale:Date.parse(current.at)<cutoff,partial:Date.parse(baseline.at)>cutoff,days:(Date.parse(current.at)-Date.parse(baseline.at))/86400000,changes:Object.fromEntries(keys.map(k=>[k,current.resources[k]-baseline.resources[k]]))};
}
export function resourceHistoryHTML(account,key='pe'){
 if(!keys.includes(key))key='pe';const points=normalizeResourceHistory(account.resourceHistory);
 if(!points.length)return '<section class="card might-history resource-history"><h3>Resource history</h3><p>Enter or import balances to start tracking. Saved balances show net changes, including earning, spending, purchases and corrections.</p></section>';
 const first=points[0],last=points.at(-1),week=weeklyResourceChange(points),gain=last.resources[key]-first.resources[key];
 return `<section class="card might-history resource-history"><div class="heading"><div><span class="eyebrow">BALANCES OVER TIME</span><h3>Resource history</h3><small>Tracking since ${date(first.at)}</small></div><select id="history-resource" aria-label="Resource to chart">${keys.map(k=>`<option value="${k}" ${k===key?'selected':''}>${resourceHistoryLabels[k]}</option>`).join('')}</select></div><div class="history-metrics"><div><small>First recorded</small><strong>${fmt(first.resources[key])}</strong></div><div><small>Latest balance</small><strong>${fmt(last.resources[key])}</strong></div><div><small>Net change · ${week.partial?'tracking period':'weekly check-ins'}</small><strong class="${week.changes[key]>=0?'history-positive':'history-negative'}">${week.stale?'—':signed(week.changes[key])}</strong><small>${date(week.baseline.at)} – ${date(last.at)}</small></div></div>${historyChart(points.map(p=>({at:p.at,value:p.resources[key]})),{label:resourceHistoryLabels[key]+' recorded balances',color:colors[key],id:'resource-chart'})}<div class="history-subheading"><h4>Weekly net changes</h4><span class="context-chip">${week.stale?'Update balances for this week':week.partial?'Less than 7 days recorded':'Latest weekly check-ins'}</span></div><p class="help">${week.stale?'No balance has been saved in the last seven days. Update resources to see a current comparison.':week.partial?'A full week is not available yet; this shows change since the first check-in.':'Uses the latest check-in at or before seven days ago and the latest saved balance. Check-in gaps may span more than a week.'} Positive changes are net increases, not total earned through playing.</p><div class="weekly-resources">${keys.map(k=>`<div><small>${resourceHistoryLabels[k]}</small><strong class="${week.changes[k]>=0?'history-positive':'history-negative'}">${week.stale?'—':signed(week.changes[k])}</strong><small>Latest ${fmt(last.resources[k])}</small></div>`).join('')}</div><p class="help">Spending, purchases, ticket conversions and manual corrections affect balances. Update balances regularly to track progress. History is saved per account and included in backups.</p><details class="history-records"><summary>Exact resource check-ins</summary><div class="tablewrap"><table><thead><tr><th>Saved</th>${keys.map(k=>`<th>${resourceHistoryLabels[k]}</th>`).join('')}</tr></thead><tbody>${points.slice().reverse().map(p=>`<tr><td>${new Date(p.at).toLocaleString()}</td>${keys.map(k=>`<td>${fmt(p.resources[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details></section>`;
}
