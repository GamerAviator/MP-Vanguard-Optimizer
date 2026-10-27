importScripts('names.js','unit-map.js','extract.js','export.js');
const allowed=url=>{try{return /(^|\.)(mighty-party|blitzmightyparty)\.com$/.test(new URL(url).hostname)}catch{return false}};
const queues=new Map();
function enqueue(tabId,task){const next=(queues.get(tabId)||Promise.resolve()).catch(()=>{}).then(task);queues.set(tabId,next);next.finally(()=>{if(queues.get(tabId)===next)queues.delete(tabId)}).catch(()=>{});return next}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
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
