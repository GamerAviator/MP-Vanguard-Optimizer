import {database} from './data.js';
import {readLevel,orderScreenshots,screenshotLayout} from './grid-import.js';
import {screenshotCells,loadPortraitReferences,matchCardPortrait,cardThumbnail} from './portrait-match.js';
const norm=s=>s.toLowerCase().replace(/[^a-z]/g,'');
function distance(a,b){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]!==b[j-1]));row=next;}return row[b.length]}
export function matchName(text){const n=norm(text);if(!n)return null;const matches=database.map(v=>({v,score:1-distance(n,norm(v.name))/Math.max(n.length,norm(v.name).length)})).sort((a,b)=>b.score-a.score);if(matches[0].score<.7||(matches[1]&&matches[0].score-matches[1].score<.12))return null;return {name:matches[0].v.name,confidence:matches[0].score}}
export function parseLines(lines){const out=[];for(let i=0;i<lines.length;i++){const line=lines[i];const text=line.text.replace(/\b(?:level|lvl|lv)\.?\s*/ig,'').trim();const number=text.match(/\b\d{1,6}\b/);const name=text.replace(/\b\d{1,6}\b/g,'').trim();let match=matchName(name);if(!match)continue;let level=number?Number(number[0]):null;if(level===null){const next=lines[i+1];if(next&&/^\s*(?:(?:level|lvl|lv)\.?\s*)?\d{1,6}\s*$/i.test(next.text))level=Number(next.text.match(/\d+/)[0]);}out.push({...match,level,confidence:Math.min(match.confidence,(line.confidence??50)/100)*(level===null?.5:1)});}return out}
async function loadOCR(){if(window.Tesseract)return;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(Error('OCR download unavailable. Try again online.'));document.head.append(script)})}
let cleanup=()=>{};
export async function review(files,account,save,done,notice,mode='portrait'){cleanup();files=orderScreenshots(files);if(!files.length)return;if(files.some(f=>f.size>20*1024*1024))throw Error('Use screenshots smaller than 20 MB.');const target=document.querySelector('#review');if(!target)return;let stopped=false,busy=false,reader=null;const urls=[],screens=[];cleanup=()=>{stopped=true;urls.forEach(URL.revokeObjectURL);reader?.terminate();reader=null;};target.replaceChildren();const heading=document.createElement('h3');heading.textContent='1. Match the grid to your cards';heading.style.marginTop='24px';target.append(heading);const help=document.createElement('p');help.className='help';help.textContent=mode==='portrait'?'Match the blue boxes to complete visible cards. Set the row and column counts, then align the corners. Portrait matching works with missing cards and filtered rosters; names do not come from positions. For a short final row, crop to those cards and set its column count.':'Fixed-order mode requires all 50 Vanguards in game order. Check the first visible row and every name label; use fresh screenshots with Grothmar at #5.';target.append(help);const setup=document.createElement('div');setup.className='alignment-stage';target.append(setup);const alignmentTabs=document.createElement('div');alignmentTabs.className='screenshot-tabs';alignmentTabs.setAttribute('aria-label','Choose screenshot to align');setup.append(alignmentTabs);let nextRow=1;
for(let i=0;i<files.length;i++){const url=URL.createObjectURL(files[i]);urls.push(url);const img=new Image();img.src=url;await img.decode();if(stopped||!target.isConnected)return;const preset=screenshotLayout(img.naturalWidth,img.naturalHeight,mode==='portrait'?1:nextRow);const box=document.createElement('div');box.className='card import-setup';const title=document.createElement('h3');title.textContent=`Screenshot ${i+1}`;const filename=document.createElement('small');filename.className='screenshot-filename';filename.textContent=files[i].name;box.append(filename);box.append(title);const controls=document.createElement('div');controls.className='toolbar';const label=document.createElement('label');label.textContent='First visible row ';const rowSelect=document.createElement('select');for(let r=1;r<=9;r++){const option=document.createElement('option');option.value=r;option.textContent=`Row ${r} · ${database[(r-1)*6].name}`;rowSelect.append(option);}rowSelect.value=preset.startRow;label.append(rowSelect);label.hidden=mode==='portrait';const rowsLabel=document.createElement('label');rowsLabel.textContent='Visible complete rows ';const rowCount=document.createElement('select');for(let r=1;r<=9;r++){const o=document.createElement('option');o.value=r;o.textContent=r;rowCount.append(o);}rowCount.value=preset.rows;rowsLabel.append(rowCount);const columnsLabel=document.createElement('label');columnsLabel.textContent='Visible columns ';const columnsSelect=document.createElement('select');for(let c=1;c<=6;c++){const o=document.createElement('option');o.value=c;o.textContent=c;columnsSelect.append(o);}columnsSelect.value=preset.columns;columnsLabel.append(columnsSelect);controls.append(label,rowsLabel,columnsLabel);box.append(controls);const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.className='alignment-preview';canvas.setAttribute('aria-label','Screenshot grid alignment preview');box.append(canvas);const config={img,url,startRow:Number(rowSelect.value),rows:Number(rowCount.value),crop:{...preset.crop},columns:preset.columns,source:i};screens.push(config);nextRow=config.startRow+config.rows;let selecting=null;const actions=document.createElement('div');actions.className='actions';for(const [key,text] of [['top','Set top-left corner'],['bottom','Set bottom-right corner']]){const button=document.createElement('button');button.textContent=text;button.onclick=()=>{selecting=key;notice('Tap the '+(key==='top'?'top-left edge of the first':'bottom-right edge of the last')+' card in this screenshot.')};actions.append(button);}const reset=document.createElement('button');reset.textContent='Reset alignment';reset.onclick=()=>{config.crop={...preset.crop};draw()};actions.append(reset);box.append(actions);const status=document.createElement('p');status.className='help';box.append(status);function draw(){const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);const cells=screenshotCells({width:canvas.width,height:canvas.height,...config},mode);for(const cell of cells){ctx.strokeStyle='#65baff';ctx.lineWidth=Math.max(1,canvas.width/400);ctx.strokeRect(cell.x,cell.y,cell.width,cell.height);const fontSize=Math.max(10,canvas.width/85);ctx.font=`bold ${fontSize}px system-ui`;ctx.fillStyle='rgba(16,24,35,.85)';ctx.fillRect(cell.x,cell.y,cell.width,fontSize*1.7);ctx.fillStyle='#65baff';ctx.fillText(mode==='portrait'?`Card ${cell.row},${cell.column}`:`${cell.index+1}. ${cell.name}`,cell.x+3,cell.y+fontSize*1.2,cell.width-6);}status.textContent=mode==='portrait'?`${cells.length} visible card cells. Every card must sit inside its own box. Cards are identified from portraits, independently of missing cards.`:`Maps positions ${(config.startRow-1)*6+1}–${Math.min(database.length,(config.startRow-1+config.rows)*6)}. Confirm every card lines up with its labeled grid cell.`;}
columnsSelect.onchange=()=>{config.columns=Number(columnsSelect.value);draw()};rowSelect.onchange=()=>{config.startRow=Number(rowSelect.value);config.rows=Math.min(config.rows,10-config.startRow);rowCount.value=config.rows;draw()};rowCount.onchange=()=>{config.rows=mode==='portrait'?Number(rowCount.value):Math.min(Number(rowCount.value),10-config.startRow);rowCount.value=config.rows;draw()};canvas.onpointerdown=e=>{if(!selecting||busy)return;const rect=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));const c=config.crop;if(selecting==='top'){const right=c.x+c.width,bottom=c.y+c.height;if(x>=right||y>=bottom){notice('Top-left must be above and left of the bottom-right.');return}config.crop={x,y,width:right-x,height:bottom-y};}else{if(x<=c.x||y<=c.y){notice('Bottom-right must be below and right of the top-left.');return}c.width=x-c.x;c.height=y-c.y;}selecting=null;draw();notice('Alignment updated. Check the overlay before reading levels.')};draw();setup.append(box);box.hidden=i!==0;const tab=document.createElement('button');tab.textContent=`Image ${i+1}`;tab.classList.toggle('active',i===0);tab.setAttribute('aria-pressed',String(i===0));tab.onclick=()=>{setup.querySelectorAll('.import-setup').forEach(el=>el.hidden=el!==box);alignmentTabs.querySelectorAll('button').forEach(el=>{el.classList.toggle('active',el===tab);el.setAttribute('aria-pressed',String(el===tab))})};alignmentTabs.append(tab);}
const start=document.createElement('button');start.className='primary';start.textContent='Read cards & levels →';
const progress=document.createElement('p');progress.className='import-progress';progress.setAttribute('role','status');target.append(start,progress);
const output=document.createElement('div');target.append(output);
start.onclick=async()=>{
 busy=true;start.disabled=true;target.querySelectorAll('.import-setup button,.import-setup select').forEach(el=>el.disabled=true);
 const candidates=[];
 try{
  let references=[];
  if(mode==='portrait'){progress.textContent='Loading known portraits…';try{references=await loadPortraitReferences()}catch(err){if(!stopped)notice('Portrait references unavailable. Choose cards manually in review.')}}
  if(stopped||!target.isConnected)return;
  progress.textContent='Loading level reader…';
  try{await loadOCR();if(stopped||!target.isConnected)return;reader=await window.Tesseract.createWorker('eng',1);await reader.setParameters({tessedit_pageseg_mode:'6'})}catch(err){await reader?.terminate();reader=null;if(!stopped)notice('Level reader unavailable. Match cards and enter their levels manually in review.')}
  for(const screen of screens){
   const cells=screenshotCells({width:screen.img.naturalWidth,height:screen.img.naturalHeight,...screen},mode);
   for(let n=0;n<cells.length;n++){
    if(stopped||!target.isConnected)return;
    const cell=cells[n];progress.textContent=`Image ${screen.source+1} of ${screens.length} · Card ${n+1} of ${cells.length}`;
    const match=mode==='portrait'?(references.length?matchCardPortrait(screen.img,cell,references):{name:null,index:null,matchConfidence:0,matchMethod:'Choose card manually',highConfidence:false}):{name:cell.name,index:cell.index,matchConfidence:1,matchMethod:'Fixed position',highConfidence:true};
    let parsed={level:null,confidence:0,method:'Level unreadable — enter manually'};
    if(reader){
     try{
      const crop=document.createElement('canvas');crop.width=Math.round(cell.width*3);crop.height=Math.round(cell.height*.32*3);const ctx=crop.getContext('2d');
      ctx.drawImage(screen.img,cell.x,cell.y+cell.height*.68,cell.width,cell.height*.32,0,0,crop.width,crop.height);
      const {data}=await reader.recognize(crop);parsed=readLevel(data.text,data.confidence);
      if(parsed.level===null){crop.height=Math.round(cell.height*.45*3);ctx.drawImage(screen.img,cell.x,cell.y+cell.height*.55,cell.width,cell.height*.45,0,0,crop.width,crop.height);await reader.setParameters({tessedit_pageseg_mode:'11'});const retry=await reader.recognize(crop);parsed=readLevel(retry.data.text,retry.data.confidence);await reader.setParameters({tessedit_pageseg_mode:'6'})}
     }catch(err){if(stopped)return;await reader?.terminate();reader=null;notice('Some levels could not be read. Enter blank levels manually in review.')}
    }
    candidates.push({...parsed,...match,thumbnail:cardThumbnail(screen.img,cell),row:cell.row,column:cell.column,source:screen.source});
   }
  }
  if(!stopped&&target.isConnected){
   setup.hidden=true;start.hidden=true;heading.hidden=true;help.hidden=true;progress.hidden=true;
   renderReview(output,candidates,screens,account,save,done,notice,()=>{output.replaceChildren();setup.hidden=false;start.hidden=false;heading.hidden=false;help.hidden=false;progress.hidden=false;progress.textContent='Adjust the grid, then read again.'});
  }
 }catch(err){if(!stopped)notice('Screenshot reading failed: '+err.message)}
 finally{await reader?.terminate();reader=null;busy=false;if(!stopped&&target.isConnected){start.disabled=false;target.querySelectorAll('.import-setup button,.import-setup select').forEach(el=>el.disabled=false)}}
};
notice(mode==='portrait'?'Align the visible cards. Missing Vanguards will not shift matches. No levels have changed.':'Confirm the full-roster starting row. No levels have changed.');
}
function renderReview(target,candidates,screens,account,save,done,notice,back){
 target.replaceChildren();
 const title=document.createElement('h3');title.textContent='3. Verify cards and levels';target.append(title);
 const help=document.createElement('p');help.className='help';help.textContent='Check the captured card against its suggested portrait. Card similarity and level OCR confidence are separate estimates, not guarantees. Choose a card manually if needed; all entries start unchecked.';target.append(help);
 const summary=document.createElement('p');summary.className='import-summary';target.append(summary);
 let button;
 const counts=()=>{const out={};for(const c of candidates)if(c.name)out[c.name]=(out[c.name]||0)+1;return out};
 const updateSummary=()=>{
  const duplicates=counts();
  for(const c of candidates){if(!c.check)continue;const card=database.find(v=>v.name===c.name);c.check.disabled=!card;if(!card)c.check.checked=false;
   c.nameLabel.textContent=card?`${database.indexOf(card)+1}. ${card.name} · ${card.rarity}`:'Unmatched card — choose below';
   c.detail.textContent=`Image row ${c.row}, column ${c.column} · ${card?`${card.faction} · ${card.attackType} · Current ${account.levels[card.name]||0}`:'No position-based name assigned'}`;
   c.matchLabel.textContent=`Card: ${c.matchMethod||'Fixed position'}${c.matchMethod==='Manual selection'?'':` · ${Math.round((c.matchConfidence??1)*100)}% similarity`}${duplicates[c.name]>1?' · Duplicate':''}`;
   c.matchLabel.className='confidence-pill '+((c.highConfidence??true)&&card?'confident':'needs-review');
   if(c.reference){c.reference.hidden=!card;if(card){c.reference.src=card.portrait;c.reference.alt=card.name+' known portrait'}}
  }
  const selected=candidates.filter(c=>c.check?.checked).length;
  summary.textContent=`${selected} selected · ${candidates.filter(c=>!c.name).length} unmatched · ${candidates.filter(c=>c.level===null).length} unreadable levels · ${candidates.filter(c=>c.name&&duplicates[c.name]>1).length} duplicate entries`;
  if(button)button.textContent=`Apply ${selected} levels to ${account.name}`;
 };
 const actions=document.createElement('div');actions.className='actions review-actions';
 const backButton=document.createElement('button');backButton.textContent='← Adjust alignment';backButton.onclick=back;actions.append(backButton);
 for(const [text,select] of [['Select readable levels',true],['Clear selection',false]]){
  const action=document.createElement('button');action.textContent=text;action.onclick=()=>{const duplicates=counts();for(const c of candidates)c.check.checked=select&&Boolean(c.name)&&c.level!==null&&duplicates[c.name]===1&&(c.highConfidence??true);updateSummary()};actions.append(action);
 }
 target.append(actions);
 const bulkNote=document.createElement('p');bulkNote.className='help';bulkNote.textContent='Bulk selection skips uncertain card matches, unknown cards, unreadable levels, and duplicates. Review selected entries before applying.';target.append(bulkNote);
 const tabs=document.createElement('div');tabs.className='screenshot-tabs';target.append(tabs);
 for(const screen of screens){
  const box=document.createElement('div');box.className='card review';box.hidden=screen.source!==0;
  const tab=document.createElement('button');tab.textContent=`Image ${screen.source+1}`;tab.classList.toggle('active',screen.source===0);tab.setAttribute('aria-pressed',String(screen.source===0));
  tab.onclick=()=>{target.querySelectorAll('.review').forEach(el=>el.hidden=el!==box);tabs.querySelectorAll('button').forEach(el=>{el.classList.toggle('active',el===tab);el.setAttribute('aria-pressed',String(el===tab))})};tabs.append(tab);
  const heading=document.createElement('h3');heading.textContent=`Screenshot ${screen.source+1}`;box.append(heading);
  const layout=document.createElement('div');layout.className='import-review-layout';
  const reference=document.createElement('figure');reference.className='import-review-reference';
  const image=document.createElement('img');image.src=screen.url;image.alt=`Original screenshot ${screen.source+1}`;
  const caption=document.createElement('figcaption');caption.textContent='Match each captured card and verify its level.';
  const zoom=document.createElement('a');zoom.href=screen.url;zoom.target='_blank';zoom.rel='noopener';zoom.className='button';zoom.textContent='Open full-size screenshot';reference.append(image,caption,zoom);
  const entries=document.createElement('div');entries.className='import-review-entries';layout.append(reference,entries);box.append(layout);
  for(const c of candidates.filter(c=>c.source===screen.source)){
   const row=document.createElement('div');row.className='import-review-row portrait-review-row';
   const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label',`Accept card at image row ${c.row}, column ${c.column}`);check.onchange=updateSummary;
   const label=document.createElement('div');label.className='portrait-review-identity';
   const images=document.createElement('div');images.className='portrait-comparison';
   if(c.thumbnail){const captured=document.createElement('img');captured.src=c.thumbnail;captured.alt=`Captured card at row ${c.row}, column ${c.column}`;captured.className='captured-card';images.append(captured)}
   const known=document.createElement('img');known.className='matched-portrait';known.width=54;known.height=54;images.append(known);c.reference=known;
   const name=document.createElement('strong'),detail=document.createElement('small');label.append(images,name,detail);
   const selector=document.createElement('select');selector.className='card-match-select';selector.setAttribute('aria-label',`Vanguard identity at image ${screen.source+1}, row ${c.row}, column ${c.column}`);
   const blank=document.createElement('option');blank.value='';blank.textContent='Choose Vanguard…';selector.append(blank);
   for(const v of database){const option=document.createElement('option');option.value=v.name;option.textContent=`${v.name} · ${v.rarity} · ${v.faction} ${v.attackType}`;selector.append(option)}
   selector.value=c.name||'';selector.onchange=()=>{c.name=selector.value||null;c.index=database.findIndex(v=>v.name===c.name);c.matchMethod='Manual selection';c.matchConfidence=c.name?1:0;c.highConfidence=Boolean(c.name);check.checked=false;updateSummary()};label.append(selector);c.selector=selector;
   if(c.suggestions?.length){const suggestions=document.createElement('small');suggestions.textContent='Suggestions: '+c.suggestions.map(v=>`${v.name} ${Math.round(v.score*100)}%`).join(' · ');label.append(suggestions)}
   const level=document.createElement('input');level.type='number';level.min=1;level.max=100000;level.step=1;level.inputMode='numeric';level.value=c.level??'';level.setAttribute('aria-label',`Imported level at row ${c.row}, column ${c.column}`);
   const status=document.createElement('div');status.className='review-confidence';
   const cardConfidence=document.createElement('small'),levelConfidence=document.createElement('small');levelConfidence.className='confidence-pill '+(c.level!==null&&c.confidence>=.85?'confident':'needs-review');levelConfidence.textContent=`Level OCR: ${Math.round(c.confidence*100)}% · ${c.method}`;status.append(cardConfidence,levelConfidence);
   row.append(check,label,level,status);Object.assign(c,{check,input:level,nameLabel:name,detail,matchLabel:cardConfidence});entries.append(row);
  }
  target.append(box);
 }
 button=document.createElement('button');button.className='primary';
 const applyBar=document.createElement('div');applyBar.className='import-apply-bar';const applyNote=document.createElement('small');applyNote.textContent='Only checked, identified cards change. Missing cards and other saved levels stay untouched.';applyBar.append(applyNote,button);target.append(applyBar);updateSummary();
 button.onclick=async()=>{
  const selected=candidates.filter(c=>c.check.checked),changes={};
  if(!selected.length){notice('Select the reviewed rows you want to apply.');return}
  for(const c of selected){if(!database.some(v=>v.name===c.name)){notice('Choose a known Vanguard for every selected card.');return}const l=Number(c.input.value);if(!c.input.value.toString().trim()||!Number.isSafeInteger(l)||l<1||l>100000){notice('Correct the selected level for '+c.name);return}if(c.name in changes){notice('Select only one imported row for '+c.name);return}changes[c.name]=l;}
  Object.assign(account.levels,changes);account.rosterUpdatedAt=new Date().toISOString();account.updatedAt=account.rosterUpdatedAt;await save();cleanup();done();notice(`${selected.length} reviewed levels applied.`);
 };
 notice('Review ready. Verify both portraits and levels before selecting.');
}
