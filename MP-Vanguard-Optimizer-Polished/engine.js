import {database,rarities,essenceCosts} from './data.js';
export const keys=['pe','Order','Nature','Chaos','regatta','chariot'];
export function might(rarity,l){if(!l)return 0;if(rarity==='Mythic')return might('Legendary',l)*12/10;const r=rarities[rarity];return l<1000?Math.floor(r.factor*l**1.5+r.constant):r.base1000+r.postGain*(l-1000)}
export function cost(l,m=1){return {j:(l>=1000?65000:Math.floor(2*l**1.5+8))*m,p:(l%10===0?essenceCosts[Math.min(l,1000)]:0)*m}}
export function validate(a){for(const k of keys)if(!Number.isSafeInteger(a.resources[k])||a.resources[k]<0)throw Error('Resources must be nonnegative whole numbers.');for(const v of database){const l=a.levels[v.name]||0;if(!Number.isSafeInteger(l)||l<0||l>100000)throw Error('Levels must be whole numbers from 0 to 100,000.');}}
function setup(a){validate(a);const b={...a.resources};b.pe+=14000*(Math.floor(b.regatta/2500)+Math.floor(b.chariot/2500));return {b,m:a.settings.guildBoost?.95:1,items:database.filter(v=>a.levels[v.name]>0).map(v=>({...v,start:a.levels[v.name],level:a.levels[v.name]}))}}
// Aggregate in integer tenths so every faction/type subtotal stays exact.
export function mightBreakdown(items){
 const factions={},attackTypes={},aggregate=list=>{const start=list.reduce((s,v)=>s+Math.round(might(v.rarity,v.start)*10),0),end=list.reduce((s,v)=>s+Math.round(might(v.rarity,v.level)*10),0);return {startingMight:start/10,finalMight:end/10,mightGained:(end-start)/10};};
 for(const faction of ['Order','Nature','Chaos']){const roster=items.filter(v=>v.faction===faction);factions[faction]={...aggregate(roster),attackTypes:{}};for(const type of ['Melee','Ranged'])factions[faction].attackTypes[type]=aggregate(roster.filter(v=>v.attackType===type));}
 for(const type of ['Melee','Ranged'])attackTypes[type]=aggregate(items.filter(v=>v.attackType===type));
 return {factions,attackTypes,total:aggregate(items)};
}
function summary(a,items,b,mode,status){const remaining={...a.resources},spent={...a.resources};
const rawPE=items.reduce((s,v)=>s+(v.p||0),0);let bundles=Math.max(0,Math.ceil((rawPE-a.resources.pe-1e-7)/14000));const rg=Math.min(bundles,Math.floor(a.resources.regatta/2500));bundles-=rg;const ch=bundles;remaining.regatta-=rg*2500;remaining.chariot-=ch*2500;remaining.pe=a.resources.pe+(rg+ch)*14000-rawPE;
for(const f of ['Order','Nature','Chaos'])remaining[f]=b[f]-items.filter(v=>v.faction===f).reduce((s,v)=>s+(v.j||0),0);
for(const k of keys){remaining[k]=Math.max(0,remaining[k]);spent[k]=a.resources[k]-remaining[k];} // PE spent separately reports actual upgrade consumption
spent.pe=rawPE;
const startingMight=Math.round(items.reduce((s,v)=>s+Math.round(might(v.rarity,v.start)*10),0)/10),finalMight=Math.round(items.reduce((s,v)=>s+Math.round(might(v.rarity,v.level)*10),0)/10);
return {mode,status,startingMight,finalMight,breakdown:mightBreakdown(items),mightGained:finalMight-startingMight,levelsGained:items.reduce((s,v)=>s+v.level-v.start,0),upgrades:items.filter(v=>v.level>v.start).map(v=>({...v,gain:might(v.rarity,v.level)-might(v.rarity,v.start)})),spent,remaining,conversions:rg+ch}}
export function balanced(a){
 const {items,b,m}=setup(a),left={...b};
 for(let n=0;n<1000000;n++){
  const foundation=items.some(v=>v.level<v.target);
  const faction=Object.fromEntries(['Order','Nature','Chaos'].map(f=>[f,items.filter(v=>v.faction===f).reduce((s,v)=>s+might(v.rarity,v.level),0)]));
  const eligible=items.filter(v=>foundation?v.level<v.target:v.rarity==='Mythic').map(v=>({v,c:cost(v.level,m)})).filter(({v,c})=>c.j<=left[v.faction]+1e-7&&c.p<=left.pe+1e-7);
  if(!eligible.length)break;
  // First strengthen the weakest faction that has an affordable eligible upgrade.
  const weakest=Math.min(...eligible.map(({v})=>faction[v.faction]));
  let best=null,score=-1;
  for(const candidate of eligible){const {v,c}=candidate;if(faction[v.faction]>weakest+1e-7)continue;
   const delta=might(v.rarity,v.level+1)-might(v.rarity,v.level);let w=1+6*Math.max(0,1-v.level/v.target);
   if(['Legendary','Mythic'].includes(v.rarity)){const tier=items.filter(x=>['Legendary','Mythic'].includes(x.rarity));const ta=tier.reduce((s,x)=>s+x.level/x.target,0)/tier.length;w*=Math.max(.55,Math.min(1.9,1+1.2*(ta-v.level/v.target)));}
   const efficiency=delta/c.j*w;if(efficiency>score){score=efficiency;best=candidate;}
  }
  const {v,c}=best;v.level++;v.j=(v.j||0)+c.j;v.p=(v.p||0)+c.p;left[v.faction]-=c.j;left.pe-=c.p;
 }
 return summary(a,items,b,'Balanced Account','Policy plan');
}
// Integer tenths preserve Mythic fractions without floating-point comparisons.
const units=(rarity,level)=>Math.round(might(rarity,level)*10);
function resourceUse(a,result,b){return keys.reduce((t,k)=>t+((k==='pe'?b.pe:a.resources[k])?Math.max(0,result.spent[k])/(k==='pe'?b.pe:a.resources[k]):0),0)}
// Initial candidates use only might/resource efficiency. They add no balance constraints.
function efficiencySeed(a,jewelWeight,initialPlan=null,deadline=Infinity){const {items,b,m}=setup(a),left={...b};if(initialPlan){const levels=new Map(initialPlan.upgrades.map(v=>[v.name,v.level]));for(const v of items){const end=levels.get(v.name)||v.start;while(v.level<end){const c=cost(v.level,m);v.j=(v.j||0)+c.j;v.p=(v.p||0)+c.p;left[v.faction]-=c.j;left.pe-=c.p;v.level++;}}}for(let n=0;n<1000000;n++){if(Date.now()>=deadline)break;let best=null,bestScore=-1;for(const v of items){let l=v.level,j=0,p=0;const end=l%10===0?l+10:Math.ceil(l/10)*10;while(l<end){const c=cost(l,m);if(j+c.j>left[v.faction]+1e-7||p+c.p>left.pe+1e-7)break;j+=c.j;p+=c.p;l++;}if(l===v.level)continue;const gain=units(v.rarity,l)-units(v.rarity,v.level);const denominator=(b.pe?p/b.pe:0)+(b[v.faction]?j/b[v.faction]*jewelWeight:0);const score=gain/Math.max(1e-12,denominator);if(score>bestScore){bestScore=score;best={v,l,j,p};}}if(!best)break;const {v,l,j,p}=best;v.level=l;v.j=(v.j||0)+j;v.p=(v.p||0)+p;left[v.faction]-=j;left.pe-=p;}return summary(a,items,b,'Max Might','Searching — best found')}
export function* maxMight(a,balancedPlan=balanced(a)){
 const {items,b,m}=setup(a);let bestGain=-1,bestUse=-1,best=items.map(v=>({...v})),nodes=0;
 const startUnits=items.reduce((s,v)=>s+units(v.rarity,v.start),0);
 const displayedGain=g=>Math.round((startUnits+g)/10)-Math.round(startUnits/10);
 function consider(candidate){const g=candidate.reduce((s,v)=>s+units(v.rarity,v.level)-units(v.rarity,v.start),0),result=summary(a,candidate,b,'Max Might','Searching — best found'),use=resourceUse(a,result,b);if(displayedGain(g)>displayedGain(bestGain)||(displayedGain(g)===displayedGain(bestGain)&&use>bestUse)){bestGain=g;bestUse=use;best=candidate.map(v=>({...v}));}}
 function planItems(plan){const upgraded=new Map(plan.upgrades.map(v=>[v.name,v]));return items.map(v=>({...v,...(upgraded.get(v.name)||{})}));}
 consider(planItems(balancedPlan));
 yield summary(a,best,b,'Max Might','Searching — best found');
 for(const w of [.1,1,10]){consider(planItems(efficiencySeed(a,w)));yield summary(a,best,b,'Max Might','Searching — best found');}
 const options=items.map(v=>{let j=0,p=0,l=v.start;const o=[{level:l,j,p,gain:0}];while(true){const c=cost(l,m);j+=c.j;p+=c.p;if(j>b[v.faction]+1e-7||p>b.pe+1e-7)break;l++;o.push({level:l,j,p,gain:units(v.rarity,l)-units(v.rarity,v.start)});}return o.reverse();});
 // Lagrangian relaxations of the shared essence constraint give admissible upper bounds.
 // Each remaining Vanguard may independently choose its best final level; faction constraints
 // are ignored in these bounds, so they can overestimate but cannot prune a better plan.
 const lambdas=[0,.25,.5,1,1.5,2,2.5,3,4,5,10,20,50,100];
 const bounds=lambdas.map(lambda=>{const suffix=Array(items.length+1).fill(0);for(let i=items.length-1;i>=0;i--){let max=0;for(const o of options[i])max=Math.max(max,o.gain-lambda*o.p);suffix[i]=suffix[i+1]+max;}return suffix;});
 const chosen=[],spent={pe:0,Order:0,Nature:0,Chaos:0};
 function* dfs(i,g){let upper=Infinity;for(let k=0;k<lambdas.length;k++)upper=Math.min(upper,g+Math.max(0,b.pe-spent.pe)*lambdas[k]+bounds[k][i]);if(displayedGain(upper+1e-5)<displayedGain(bestGain))return;
 if(i===items.length){consider(items.map((v,k)=>({...v,...chosen[k]})));return;}
 for(const o of options[i]){const f=items[i].faction;if(spent[f]+o.j>b[f]+1e-7||spent.pe+o.p>b.pe+1e-7)continue;spent[f]+=o.j;spent.pe+=o.p;chosen[i]=o;yield* dfs(i+1,g+o.gain);spent[f]-=o.j;spent.pe-=o.p;if(++nodes%20000===0)yield summary(a,best,b,'Max Might','Searching — best found');}}
 yield* dfs(0,0);yield summary(a,best,b,'Max Might','Proven optimal');
}

// Reuse an existing feasible level plan with another cost multiplier. Useful for
// carrying a no-boost incumbent into the boosted feasible set without rerunning it.
export function repricePlan(a,plan){const {items,b,m}=setup(a),byName=new Map(plan.upgrades.map(v=>[v.name,v]));for(const v of items){const out=byName.get(v.name);if(!out)continue;if(out.start!==v.start||!Number.isSafeInteger(out.level)||out.level<v.start)throw Error('Plan does not match this roster.');v.level=out.level;v.j=0;v.p=0;for(let l=v.start;l<v.level;l++){const c=cost(l,m);v.j+=c.j;v.p+=c.p;}}const usedPE=items.reduce((s,v)=>s+(v.p||0),0);if(usedPE>b.pe+1e-6||['Order','Nature','Chaos'].some(f=>items.filter(v=>v.faction===f).reduce((s,v)=>s+(v.j||0),0)>b[f]+1e-6))throw Error('Plan exceeds this budget.');return summary(a,items,b,plan.mode,'Searching — best found')}
export function compareGuildBoost(off,on){return ['max','balanced'].map(mode=>{const without=off?.[mode],withBoost=on?.[mode];if(!without||!withBoost)return {mode,pending:true};return {mode,pending:false,withoutMight:without.mightGained,withMight:withBoost.mightGained,extraMight:withBoost.mightGained-without.mightGained,withoutLevels:without.levelsGained,withLevels:withBoost.levelsGained,extraLevels:withBoost.levelsGained-without.levelsGained,percent:without.mightGained?(withBoost.mightGained/without.mightGained-1)*100:null,proven:mode==='max'&&without.status==='Proven optimal'&&withBoost.status==='Proven optimal'};})}

// Interactive mode: finite portfolio of greedy bundle plans plus budgeted local repairs.
// The exhaustive generator remains available for small-case verification, not UI workers.
export function fastMaxMight(a,balancedPlan=balanced(a),budgetMs=800){
 const deadline=Date.now()+budgetMs,{b}=setup(a);let best=balancedPlan;
 const consider=plan=>{if(plan.finalMight>best.finalMight||plan.finalMight===best.finalMight&&resourceUse(a,plan,b)>resourceUse(a,best,b))best=plan;};
 for(const weight of [.1,1,10,.03,.3,3,30,0]){if(Date.now()>=deadline)break;consider(efficiencySeed(a,weight,null,deadline));}
 if(Date.now()<deadline)consider(efficiencySeed(a,1,best,deadline));
 // Reassign the last upgrade bundle on one card and refill without balance restrictions.
 for(const v of [...best.upgrades]){if(Date.now()>=deadline)break;const lower=Math.max(v.start,Math.floor((v.level-1)/10)*10),trial={...best,upgrades:best.upgrades.map(x=>x.name===v.name?{...x,level:lower}:x)};consider(efficiencySeed(a,.1,trial,deadline));if(Date.now()<deadline)consider(efficiencySeed(a,10,trial,deadline));}
 return {...best,mode:'Max Might',status:'Fast plan — best found (not proven optimal)'};
}
