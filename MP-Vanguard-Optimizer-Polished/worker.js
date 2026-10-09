import {balanced,fastMaxMight} from './engine.js';
onmessage=e=>{try{const balancedPlan=balanced(e.data);postMessage({balanced:balancedPlan});postMessage({max:fastMaxMight(e.data,balancedPlan),done:true});}catch(e){postMessage({error:e.message,done:true})}};
