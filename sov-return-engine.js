import {balanced,fastMaxMight,repricePlan,validate} from './engine.js';
import {dropAverages,payoutKeys} from './event-engine.js';
export function savedSovReturn(account,scenario='mid'){
 validate(account);
 if(!['low','mid','high'].includes(scenario))throw Error('Choose a valid payout scenario.');
 const sov=account.resources.sov;
 if(sov===null||sov===undefined)throw Error('Record your SOV balance on Resources first.');
 if(!Number.isSafeInteger(sov)||sov<0)throw Error('SOV balance must be a nonnegative whole number.');
 const spins=Math.floor(sov/100),remainder=sov%100,averages=dropAverages(scenario),payouts=Object.fromEntries(payoutKeys.map(k=>[k,Math.floor(spins*averages[k])])),projected=structuredClone(account);
 for(const k of payoutKeys)projected.resources[k]+=payouts[k];
 projected.resources.sov=remainder;validate(projected);
 return {sov,spins,remainder,scenario,payouts,projected};
}
export function compareSavedSov(account,scenario='mid',budgetMs=350){
 const estimate=savedSovReturn(account,scenario),baseBalanced=balanced(account),baseMax=fastMaxMight(account,baseBalanced,budgetMs),projectedBalanced=balanced(estimate.projected);let projectedMax=fastMaxMight(estimate.projected,projectedBalanced,budgetMs);
 if(estimate.spins===0)return {...estimate,base:{balanced:baseBalanced,max:baseMax},plans:{balanced:baseBalanced,max:baseMax}};
 const floor=repricePlan(estimate.projected,baseMax);if(floor.finalMight>projectedMax.finalMight)projectedMax=floor;
 return {...estimate,base:{balanced:baseBalanced,max:baseMax},plans:{balanced:projectedBalanced,max:projectedMax}};
}
