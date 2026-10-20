import {compareSavedSov} from './sov-return-engine.js';
onmessage=({data})=>{try{postMessage({result:compareSavedSov(data.account,data.scenario)})}catch(e){postMessage({error:e.message})}};
