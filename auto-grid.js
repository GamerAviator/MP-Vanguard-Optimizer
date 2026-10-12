// Conservative detection of repeated horizontal card borders. No card identity
// is inferred here; uncertain screenshots retain the existing manual fallback.
export function detectGrid({width:w,height:h,data}){
 if(w<80||h<40||data.length<w*h*4)return null;
 const minRun=Math.max(10,Math.floor(w*.065)),bridge=Math.max(1,Math.round(w*.006)),lines=[];
 for(let y=2;y<h-2;y++){
  const runs=[];let start=-1,last=-1;
  for(let x=1;x<w-1;x++){
   let difference=0;for(let c=0;c<3;c++)difference+=Math.abs(data[((y+1)*w+x)*4+c]-data[((y-1)*w+x)*4+c]);
   if(difference>100){if(start<0)start=x;last=x}
   if(start>=0&&(x-last>bridge||x===w-2)){if(last-start+1>=minRun)runs.push([start,last+1]);start=-1}
  }
  // UI bars, text, or a lone frame are not enough evidence for a card grid.
  if(runs.length<2||runs.length>6)continue;
  const sizes=runs.map(r=>r[1]-r[0]),mean=sizes.reduce((a,b)=>a+b,0)/sizes.length;
  if(sizes.some(v=>Math.abs(v-mean)>mean*.18))continue;
  const pitches=runs.slice(1).map((r,i)=>r[0]-runs[i][0]),pitch=pitches.reduce((a,b)=>a+b,0)/pitches.length;
  if(pitch<mean||pitch>mean*1.45||pitches.some(v=>Math.abs(v-pitch)>mean*.14))continue;
  const previous=lines.at(-1);
  if(previous&&y-previous.y<Math.max(3,w*.008)&&previous.runs.length===runs.length&&Math.abs(previous.runs[0][0]-runs[0][0])<mean*.12){previous.y=(previous.y+y)/2;continue}
  lines.push({y,runs,mean,pitch});
 }
 let best=null;
 for(const top of lines){
  const matching=lines.filter(l=>l.y>=top.y&&l.runs.length===top.runs.length&&l.runs.every((r,i)=>Math.abs(r[0]-top.runs[i][0])<top.mean*.13&&Math.abs(r[1]-top.runs[i][1])<top.mean*.13));
  for(const second of matching.slice(1)){
   const pitch=second.y-top.y;if(pitch<top.mean*.95||pitch>top.mean*1.85)continue;
   let rows=1,last=second;
   for(let row=2;row<=9;row++){const next=matching.find(l=>Math.abs(l.y-(top.y+row*pitch))<pitch*.07);if(!next)break;rows=row;last=next}
   // Prefer the largest consistently repeated grid; reject implausible crops.
   const x=top.runs[0][0],right=top.runs.at(-1)[1],bottom=last.y;
   const area=(right-x)*(bottom-top.y),score=area*rows;
   if(area<w*h*.10||rows>9)continue;
   if(!best||score>best.score)best={score,rows,columns:top.runs.length,crop:{x:x/w,y:top.y/h,width:(right-x)/w,height:(bottom-top.y)/h},confidence:rows>=2?'strong':'tentative'};
  }
 }
 if(!best)return null;const {score,...result}=best;return result;
}
export function detectImageGrid(image){const scale=Math.min(1,640/image.naturalWidth,1600/image.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,canvas.width,canvas.height);return detectGrid(ctx.getImageData(0,0,canvas.width,canvas.height))}
