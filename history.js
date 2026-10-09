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
 if(!points.length)return '<section class="card might-history"><span class="eyebrow">YOUR PROGRESS</span><h3>Might over time</h3><p>Enter or import your first roster to begin tracking. Each saved roster change adds a recorded might value.</p></section>';
 const first=points[0],last=points.at(-1),change=last.might-first.might,percentage=first.might?change/first.might*100:null;
 const min=Math.min(...points.map(p=>p.might)),max=Math.max(...points.map(p=>p.might)),padding=Math.max(50,(max-min)*.15),low=Math.max(0,min-padding),high=max+padding;
 const firstTime=Date.parse(first.at),lastTime=Date.parse(last.at),x=p=>lastTime===firstTime?360:60+(Date.parse(p.at)-firstTime)/(lastTime-firstTime)*640,y=p=>190-(p.might-low)/(high-low)*150;
 const coords=points.map(p=>`${x(p).toFixed(1)},${y(p).toFixed(1)}`).join(' '),ticks=[low,(low+high)/2,high];
 const grid=ticks.map(n=>{const yy=y({might:n});return `<line x1="60" x2="700" y1="${yy}" y2="${yy}" stroke="#2d455c"/><text x="52" y="${yy+4}" text-anchor="end" fill="#94adc2" font-size="11">${number(Math.round(n))}</text>`}).join('');
 return `<section class="card might-history"><div class="heading"><div><span class="eyebrow">YOUR PROGRESS</span><h3>Might over time</h3><small>Tracking ${escape(account.name)} since ${date(first.at)}</small></div><span class="context-chip">${points.length} saved snapshots</span></div><div class="history-metrics"><div><small>First recorded</small><strong>${number(first.might)}</strong></div><div><small>Current recorded</small><strong>${number(last.might)}</strong></div><div><small>Change since tracking began</small><strong class="${change>=0?'history-positive':'history-negative'}">${change>=0?'+':''}${number(change)}</strong><small>${percentage===null?'':`${percentage>=0?'+':''}${percentage.toFixed(1)}%`}</small></div></div><svg class="history-chart" viewBox="0 0 740 245" role="img" aria-label="${escape(account.name)} might history: ${number(first.might)} to ${number(last.might)}, change ${number(change)}"><title>Recorded might over time</title>${grid}${points.length>1?`<polygon points="${x(first)},190 ${coords} ${x(last)},190" fill="#65baff" fill-opacity=".09"/><polyline points="${coords}" fill="none" stroke="#65baff" stroke-width="3" stroke-linejoin="round"/>`:''}${points.map(p=>`<circle cx="${x(p)}" cy="${y(p)}" r="4" fill="#f5aa4e"><title>${date(p.at)} · ${number(p.might)} might · ${p.owned} owned</title></circle>`).join('')}<text x="60" y="222" fill="#94adc2" font-size="11">${date(first.at)}</text><text x="700" y="222" text-anchor="end" fill="#94adc2" font-size="11">${date(last.at)}</text></svg><p class="help">Recorded roster values, including newly owned cards and corrections. Projected plans and resource edits do not count. Earlier unrecorded might cannot be recovered.</p><details class="history-records"><summary>View exact saved values</summary><div class="tablewrap"><table><thead><tr><th>Saved</th><th>Might</th><th>Owned</th><th>Change from first</th></tr></thead><tbody>${points.slice().reverse().map(p=>`<tr><td>${escape(new Date(p.at).toLocaleString())}</td><td>${number(p.might)}</td><td>${p.owned}</td><td>${p.might-first.might>=0?'+':''}${number(p.might-first.might)}</td></tr>`).join('')}</tbody></table></div></details></section>`;
}
