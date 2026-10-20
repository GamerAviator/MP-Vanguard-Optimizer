import {buildEventProjection} from './event-engine.js';
onmessage=e=>{try{postMessage({result:buildEventProjection(e.data.account,e.data.settings)})}catch(error){postMessage({error:error.message})}};
