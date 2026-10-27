importScripts('names.js','unit-map.js','extract.js','export.js','play-detect.js');
const allowed=url=>{try{return /(^|\.)(mighty-party|blitzmightyparty)\.com$/.test(new URL(url).hostname)}catch{return false}};
const queues=new Map();
function enqueue(tabId,task){const next=(queues.get(tabId)||Promise.resolve()).catch(()=>{}).then(task);queues.set(tabId,next);next.finally(()=>{if(queues.get(tabId)===next)queues.delete(tabId)}).catch(()=>{});return next}
async function visiblePlay(tab){
 const shot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'}),blob=await (await fetch(shot)).blob(),bitmap=await createImageBitmap(blob);
 const width=Math.min(800,bitmap.width),height=Math.round(bitmap.height*width/bitmap.width),canvas=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,width,height);bitmap.close();
 return VanguardPlayDetect.detect(ctx.getImageData(0,0,width,height));
}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m.type==='play-probe'||m.type==='play-claim'){
  const tabId=sender.tab?.id;if(tabId===undefined||!(allowed(sender.url)||(/^(about:blank|about:srcdoc|blob:|data:)/.test(sender.url||'')&&allowed(sender.origin)))){reply({done:true});return;}
  enqueue(tabId,async()=>{
   const key='capture:'+tabId,state=(await chrome.storage.local.get(key))[key];
   if(!state?.enabled||state.autoStatus!=='waiting'||state.autoPlayAttempted||!Number.isFinite(m.documentStartedAt)||m.documentStartedAt<state.startedAt||Date.now()-state.startedAt>90000)return {done:true};
   const tab=await chrome.tabs.get(tabId),active=await chrome.tabs.query({active:true,lastFocusedWindow:true});if(!tab.active||active[0]?.id!==tabId)return {done:false};
   if(m.type==='play-claim'){
    if(!m.token||m.token!==state.playToken||Date.now()-state.playMatchedAt>1500)return {done:true};
    try{const fresh=await visiblePlay(tab);if(!fresh||Math.abs(fresh.x-state.playPoint.x)>.01||Math.abs(fresh.y-state.playPoint.y)>.01)return {done:true};}catch{return {done:true};}
    if(!(await chrome.tabs.get(tabId)).active)return {done:true};
    state.autoPlayAttempted=true;state.autoPlayStatus='sent';delete state.playToken;await chrome.storage.local.set({[key]:state});return {ok:true};
   }
   if(sender.frameId!==0||!m.viewport||m.viewport.width<200||m.viewport.height<120)return {done:true};
   if(Date.now()-(state.playLastProbe||0)<1500)return {done:false};
   state.autoPlayStatus='looking';state.playLastProbe=Date.now();await chrome.storage.local.set({[key]:state});
   try{
    // Pixels are used in memory for launch detection only; never saved or exported.
    const point=await visiblePlay(tab);
    if(!point)return {done:false};
    const current=await chrome.tabs.get(tabId);if(!current.active)return {done:false};
    state.playToken=String(state.startedAt)+'-'+Math.random().toString(36).slice(2);state.playMatchedAt=Date.now();state.playPoint=point;state.autoPlayStatus='found';await chrome.storage.local.set({[key]:state});return {point,token:state.playToken};
   }catch{state.autoPlayStatus='manual';await chrome.storage.local.set({[key]:state});return {done:true};}
  }).then(reply,()=>reply({done:false}));return true;
 }
 if(m.type==='capture'){
  const tabId=sender.tab?.id;if(tabId===undefined||!allowed(sender.url)||!m.capture||JSON.stringify(m.capture).length>500000)return;
  enqueue(tabId,async()=>{
   const key='capture:'+tabId,stored=await chrome.storage.local.get([key,'id-mappings']),previous=stored[key];if(!previous?.enabled)return;
   // Ignore responses from the page that existed before the one-click reload.
   if(previous.autoStatus==='waiting'&&(!Number.isFinite(m.capture.documentStartedAt)||m.capture.documentStartedAt<previous.startedAt))return;
   const next=VanguardExtract.merge(previous,m.capture,stored['id-mappings']||{});
   if(previous.autoStatus==='waiting'&&m.capture.profileLoaded){
    try{const payload=VanguardExport.automatic(m.capture,next),filename=VanguardExport.filename(payload);next.gameProfileId=payload.gameProfileId;next.profileIdSource=payload.profileIdSource;next.enabled=false;next.autoStatus='downloading';await chrome.storage.local.set({[key]:next});
     const downloadId=await chrome.downloads.download({url:'data:application/octet-stream;charset=utf-8,'+encodeURIComponent(JSON.stringify(payload,null,2)),filename,saveAs:false,conflictAction:'uniquify'});
     next.autoStatus='complete';next.exportFilename=filename;next.downloadId=downloadId;
    }catch(e){next.autoStatus='review';next.exportError=e.message;next.enabled=true}
   }
   await chrome.storage.local.set({[key]:next});await chrome.action.setBadgeText({tabId,text:next.autoStatus==='complete'?'✓':next.autoStatus==='review'?'!':next.enabled?'•':''});
  }).catch(()=>{});return;
 }
 if(sender.id!==chrome.runtime.id||sender.tab)return;
 enqueue(m.tabId,async()=>{
  const key='capture:'+m.tabId;
  if(m.type==='start'||m.type==='extract'){
   const tab=await chrome.tabs.get(m.tabId);if(!allowed(tab.url))throw Error('Open Mighty Party in Chrome first.');
   if(m.gameProfileId&& !VanguardProfileIdentity.normalize(m.gameProfileId))throw Error('Enter a numeric game profile ID.');
   const state={expectedProfileId:VanguardProfileIdentity.normalize(m.gameProfileId),enabled:true,entries:[],resources:{},diagnostics:[],responses:0,startedAt:Date.now(),autoStatus:m.type==='extract'?'waiting':null};
   await chrome.storage.local.set({[key]:state});await chrome.action.setBadgeText({tabId:m.tabId,text:m.type==='extract'?'…':''});
   if(m.type==='extract')try{await chrome.tabs.reload(m.tabId,{bypassCache:true})}catch(e){state.enabled=false;state.autoStatus='error';state.exportError=e.message;await chrome.storage.local.set({[key]:state});throw e}
   return {ok:true};
  }
  if(m.type==='cache'){const tab=await chrome.tabs.get(m.tabId);if(!allowed(tab.url))throw Error('Open Mighty Party first.');const state=(await chrome.storage.local.get(key))[key]||{entries:[],resources:{},diagnostics:[],responses:0};state.enabled=true;await chrome.storage.local.set({[key]:state});await chrome.tabs.sendMessage(m.tabId,{type:'read-unit-cache'});return {ok:true}}
  if(m.type==='stop'){const state=(await chrome.storage.local.get(key))[key];if(state){state.enabled=false;state.autoStatus=null;await chrome.storage.local.set({[key]:state});await chrome.action.setBadgeText({tabId:m.tabId,text:''})}return {ok:true}}
  throw Error('Unknown command');
 }).then(reply,e=>reply({error:e.message}));return true;
});

// Clear any count badges left by an older extension release.
chrome.runtime.onInstalled?.addListener(()=>{chrome.tabs.query({}).then(tabs=>Promise.all(tabs.map(tab=>chrome.action.setBadgeText({tabId:tab.id,text:''})))).catch(()=>{});});
