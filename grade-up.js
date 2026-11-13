import {database} from './data.js';
import {cost,validate} from './engine.js';

export const GRADE_UP=Object.freeze({target:350,reward:'Gorrosh',names:Object.freeze(['Pyro','Viryel','Kaldrek','Drevoss']),start:Date.parse('2026-11-13T00:00:00Z'),end:Date.parse('2026-11-27T00:00:00Z')});
const currencies=['pe','Order','Nature','Chaos'];
const labels={pe:'Purple Essence',Order:'Order Jewels',Nature:'Nature Jewels',Chaos:'Chaos Jewels'};
function campaignPhase(now){
 return now<GRADE_UP.start?'upcoming':now>=GRADE_UP.end?'ended':'active';
}
export function gradeUpCountdown(now=Date.now()){
 const phase=campaignPhase(now);
 if(phase==='ended')return {phase,label:'Campaign ended',text:''};
 const remaining=Math.ceil(((phase==='upcoming'?GRADE_UP.start:GRADE_UP.end)-now)/1000);
 const pad=n=>String(n).padStart(2,'0');
 return {
  phase,label:phase==='upcoming'?'Starts in':'Time left to complete',
  text:`${Math.floor(remaining/86400)}d ${pad(Math.floor(remaining/3600)%24)}h ${pad(Math.floor(remaining/60)%60)}m ${pad(remaining%60)}s`
 };
}
export function mountGradeUpCountdown(container,onPhaseChange){
 const timer=container.querySelector('[data-grade-countdown]');
 if(!timer)return;
 const phase=timer.dataset.gradeCountdown;
 const update=()=>{
  const current=gradeUpCountdown();
  if(current.phase!==phase){onPhaseChange();return;}
  if(timer.textContent!==current.text)timer.textContent=current.text;
 };
 // Recompute from the clock so a sleeping or backgrounded tab never accumulates drift.
 const interval=setInterval(update,1000);
 document.addEventListener('visibilitychange',update);
 return ()=>{
  clearInterval(interval);
  document.removeEventListener('visibilitychange',update);
 };
}
export function gradeUpPlan(account,now=Date.now()){
 validate(account);
 const target=GRADE_UP.target,multiplier=account.settings.guildBoost?.95:1;
 const cards=GRADE_UP.names.map(name=>{
  const {faction}=database.find(v=>v.name===name),level=account.levels[name]||0;
  let essence=0,jewels=0;
  // An unowned troop must be unlocked before paying the level 1 onward costs.
  for(let l=Math.max(1,level);l<target;l++){const {p,j}=cost(l,multiplier);essence+=p;jewels+=j;}
  return {name,faction,level,essence,jewels,ready:level>=target,owned:level>0};
 });
 const required=Object.fromEntries(currencies.map(k=>[k,0]));
 for(const v of cards){required.pe+=v.essence;required[v.faction]+=v.jewels;}
 const ticketEssence=14000*(Math.floor(account.resources.regatta/2500)+Math.floor(account.resources.chariot/2500));
 const available=Object.fromEntries(currencies.map(k=>[k,account.resources[k]+(k==='pe'?ticketEssence:0)]));
 const shortfall=Object.fromEntries(currencies.map(k=>[k,Math.max(0,required[k]-available[k])]));
 const completed=cards.filter(v=>v.ready).length,unowned=cards.filter(v=>!v.owned).length;
 return {cards,required,available,shortfall,ticketEssence,completed,unowned,affordable:Object.values(shortfall).every(n=>!n),phase:campaignPhase(now)};
}

const fmt=n=>n.toLocaleString();
export function gradeUpHTML(account,now=Date.now()){
 const p=gradeUpPlan(account,now),phaseLabel={upcoming:'Upcoming',active:'Campaign live',ended:'Campaign ended'}[p.phase];
 const state=p.phase==='ended'?'Saved levels shown':p.completed===4?'All four troops meet the target':p.unowned?'Unlock required troops first':p.affordable?'Your budget covers all remaining upgrades':'More resources needed';
 const countdown=gradeUpCountdown(now);
 const spending=p.phase!=='ended'&&p.completed<4;
 return `<section class="grade-up" aria-labelledby="grade-title">
 <div class="grade-hero"><div><span class="eyebrow">VANGUARD CAMPAIGN · NOVEMBER 2026</span><h2 id="grade-title">Grade Up Challenge</h2><p>Reach level <strong>350</strong> with all four featured troops to earn <strong>Gorrosh</strong>, the new Mythic Vanguard.</p></div><div class="grade-reward"><span aria-hidden="true">🏆</span><small>MYTHIC REWARD</small><strong>Gorrosh</strong></div></div>
 <div class="grade-status"><div><span class="grade-phase ${p.phase}">${phaseLabel}</span><p>Nov 13, 00:00 UTC through Nov 26, 23:59 UTC</p></div><div class="grade-count"><strong>${p.completed} / 4</strong><span>at level 350 or higher</span></div></div>
 ${countdown.text?`<div class="grade-countdown"><span id="grade-countdown-label">${countdown.label}</span><strong role="timer" aria-live="off" aria-labelledby="grade-countdown-label" data-grade-countdown="${countdown.phase}">${countdown.text}</strong></div>`:''}
 <progress class="grade-progress" aria-label="Troops at level 350" value="${p.completed}" max="4"></progress>
 <p class="grade-result" role="status"><strong>${state}</strong>${p.phase==='ended'?' · Current saved levels cannot verify eligibility at the deadline.':p.completed===4?' · Keep them at or above 350 through the deadline.':''}</p>
 <div class="grade-troops">${p.cards.map(v=>`<article class="card grade-troop"><span class="grade-troop-state ${v.ready?'ready':''}">${v.ready?'✓ At target':v.owned?'Below target':'Unlock first'}</span><h3>${v.name}</h3><span class="${v.faction.toLowerCase()}">${v.faction}</span><strong class="grade-level">${v.owned?`Level ${fmt(v.level)}`:'Unowned'}</strong>${v.ready?'':`<p>${v.owned?`${350-v.level} levels to go`:spending?'Costs below assume unlocking at level 1':'Unlock required'}${spending?`<br>${fmt(v.essence)} essence · ${fmt(v.jewels)} ${v.faction} Jewels`:''}</p>`}</article>`).join('')}</div>
 ${spending?`<section class="card grade-budget"><div class="heading"><div><span class="eyebrow">UPGRADE BUDGET</span><h3>What it takes to finish</h3></div><span class="context-chip">Guild Boost ${account.settings.guildBoost?'ON':'OFF'}</span></div><div class="tablewrap"><table><thead><tr><th scope="col">Resource</th><th scope="col">Required</th><th scope="col">Available</th><th scope="col">Still needed</th></tr></thead><tbody>${currencies.map(k=>`<tr><th scope="row">${labels[k]}</th><td>${fmt(p.required[k])}</td><td>${fmt(p.available[k])}</td><td class="${p.shortfall[k]?'grade-shortfall':''}">${fmt(p.shortfall[k])}</td></tr>`).join('')}</tbody></table></div><p class="help">Available essence includes ${fmt(p.ticketEssence)} from full ticket bundles. Estimates use saved balances${p.unowned?' and exclude any costs to unlock troops':''}.</p></section>`:''}
 <details class="card grade-rules"><summary>Eligibility and reward delivery</summary><ul><li>All four troops must be at least level 350 when the campaign ends. Levels reached before the start count.</li><li>Partial completion does not earn Gorrosh.</li><li>Rewards are delivered the following week. No screenshots or support tickets are needed.</li></ul></details></section>`;
}
