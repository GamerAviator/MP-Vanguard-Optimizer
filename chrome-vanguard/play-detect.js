// Recognize only the launch-screen Play artwork. No coordinates are clicked without a visual match.
(()=>{
const glyph=["000000000000000000000000000000000000000000000000", "000111111111000111110000001111110001111000111100", "000111111111100111110000001111110001111000111000", "000011111111110111110000001111110001111001111000", "000011111111110111110000011111110000111101110000", "000011110011111111110000011111111000111101110000", "000011110011111011110000011101111000011111100000", "000011110011111011110000011101111000011111100000", "000011110111110011110000011101111000001111100000", "000011111111110011110000111101111000001111000000", "000011111111100011110000111111111100001111000000", "000011111111100011110000111111111100001111000000", "000011110000000011111100111111111100001111000000", "000011110000000011111100111111111100001111000000", "000011110000000011111101110000111100001111000000", "000011100000000011111101110000011110000111000000", "000001100000000011111001110000011100000111000000", "000000000000000000000000000000000000000000000000"];
const green=(r,g,b)=>g>170&&g>r*1.12&&r>65&&b<105;
function detect({width:w,height:h,data}){
 if(w<200||h<120||data.length!==w*h*4)return null;
 const seen=new Uint8Array(w*h),hits=[];
 const isGreen=i=>green(data[i*4],data[i*4+1],data[i*4+2]);
 for(let y=Math.floor(h*.62);y<h;y++)for(let x=Math.floor(w*.22);x<w*.78;x++){
  const index=y*w+x;if(seen[index]||!isGreen(index))continue;
  const queue=[index];seen[index]=1;let minX=x,maxX=x,minY=y,maxY=y;
  for(let n=0;n<queue.length;n++){const i=queue[n],px=i%w,py=Math.floor(i/w);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
   for(const j of [px?i-1:-1,px<w-1?i+1:-1,py?i-w:-1,py<h-1?i+w:-1])if(j>=0&&!seen[j]&&isGreen(j)){seen[j]=1;queue.push(j)}}
  const bw=maxX-minX+1,bh=maxY-minY+1,cx=(minX+maxX)/2/w,cy=(minY+maxY)/2/h;
  if(bw/w<.12||bw/w>.36||bh/h<.035||bh/h>.15||bw/bh<3.5||bw/bh>5.5||cx<.32||cx>.68||cy<.68||cy>.97||queue.length/(bw*bh)<.6)continue;
  let best=0;
  for(const ox of [-.012,-.006,0,.006,.012])for(const oy of [-.04,-.02,0,.02,.04])for(const stretchX of [.96,1,1.04])for(const stretchY of [.94,1,1.06]){let tp=0,tn=0,positive=0,negative=0;
   for(let gy=0;gy<18;gy++)for(let gx=0;gx<48;gx++){
    const sx=Math.round(minX+bw*(127/256+(gx/47-.5)*(98/256)*stretchX+ox)),sy=Math.round(minY+bh*(27.5/59+(gy/17-.5)*(27/59)*stretchY+oy)),i=(sy*w+sx)*4;
    const dark=data[i]<110&&data[i+1]<150,expected=glyph[gy][gx]==='1';
    if(expected){positive++;if(dark)tp++}else{negative++;if(!dark)tn++}
   }
   best=Math.max(best,Math.min(tp/positive,tn/negative));
  }
  if(best>=.84)hits.push({x:cx,y:cy,confidence:best});
 }
 return hits.length===1?hits[0]:null;
}
globalThis.VanguardPlayDetect={detect};
})();
