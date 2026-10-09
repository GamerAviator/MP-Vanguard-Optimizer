import {database} from './data.js';
import {gridCells} from './grid-import.js';
// Spatial cells have no database offset: missing/filtered cards cannot shift identities.
export function screenshotCells(config,mode='portrait'){
 if(mode==='position')return gridCells(config);
 const {width,height,crop,rows,columns=6}=config;
 if(!Number.isInteger(rows)||rows<1||rows>9||!Number.isInteger(columns)||columns<1||columns>6)throw Error('Choose 1–9 rows and 1–6 columns.');
 if(!crop||crop.x<0||crop.y<0||crop.width<=0||crop.height<=0||crop.x+crop.width>1.000001||crop.y+crop.height>1.000001)throw Error('Grid must stay inside the screenshot.');
 return Array.from({length:rows*columns},(_,slot)=>{const row=Math.floor(slot/columns),column=slot%columns;return {slot,index:null,name:null,row:row+1,column:column+1,x:(crop.x+crop.width*column/columns)*width,y:(crop.y+crop.height*row/rows)*height,width:crop.width*width/columns,height:crop.height*height/rows}});
}
export function portraitFeature(rgba){
 const values=[];let sum=0;
 for(let i=0;i<rgba.length;i+=4)for(let c=0;c<3;c++){values.push(rgba[i+c]);sum+=rgba[i+c]}
 const mean=sum/values.length;let energy=0;const centered=values.map(v=>{const n=v-mean;energy+=n*n;return n});const contrast=Math.sqrt(energy/values.length),norm=Math.sqrt(energy)||1;
 return {values:centered.map(v=>v/norm),mean,contrast};
}
export function portraitSimilarity(a,b){if(a.contrast<8||b.contrast<8||a.values.length!==b.values.length)return 0;let dot=0;for(let i=0;i<a.values.length;i++)dot+=a.values[i]*b.values[i];return Math.max(0,Math.min(1,dot));}
export function rankPortraits(features,references){
 const ranked=references.map(ref=>({...ref,score:Math.max(0,...features.map(f=>portraitSimilarity(f,ref.feature)))})).sort((a,b)=>b.score-a.score);
 const best=ranked[0],margin=best?best.score-(ranked[1]?.score||0):0;
 const accepted=Boolean(best&&best.score>=.72&&margin>=.045);
 return {name:accepted?best.name:null,index:accepted?best.index:null,matchConfidence:best?.score||0,matchMargin:margin,matchMethod:accepted?'Portrait suggestion':'Choose card manually',highConfidence:accepted&&best.score>=.86&&margin>=.075,suggestions:ranked.slice(0,3).map(({name,index,score})=>({name,index,score}))};
}
let referencePromise;
function featureFromRegion(img,region){const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,region.x,region.y,region.width,region.height,0,0,24,24);return portraitFeature(ctx.getImageData(0,0,24,24).data)}
export function loadPortraitReferences(){if(!referencePromise)referencePromise=Promise.all(database.map(async(v,index)=>{const img=new Image();img.src=new URL(v.portrait,import.meta.url).href;await img.decode();return {name:v.name,index,feature:featureFromRegion(img,{x:img.naturalWidth*.09,y:img.naturalHeight*.09,width:img.naturalWidth*.82,height:img.naturalHeight*.82})}})).catch(err=>{referencePromise=null;throw err});return referencePromise}
export function matchCardPortrait(img,cell,references){
 const features=[];
 // Search small framing differences; ignore the card footer containing might/level.
 for(const scale of [.86,.94,1.02])for(const offset of [.015,.055,.095,.135])for(const shift of [-.025,.025]){
  const size=Math.min(cell.width*scale,cell.height*.72),x=cell.x+(cell.width-size)/2+cell.width*shift,y=cell.y+cell.height*offset;
  features.push(featureFromRegion(img,{x:x+size*.09,y:y+size*.09,width:size*.82,height:size*.82}));
 }
 return rankPortraits(features,references);
}
export function cardThumbnail(img,cell){const canvas=document.createElement('canvas');canvas.width=120;canvas.height=Math.round(cell.height/cell.width*120);canvas.getContext('2d').drawImage(img,cell.x,cell.y,cell.width,cell.height,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.85)}
