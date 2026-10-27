// Runs only while an explicitly requested extraction waits for the reloaded profile.
(()=>{
const route='vanguard-play-route-v1';let stopped=false;
window.addEventListener('pointerdown',event=>{if(event.isTrusted)stopped=true;},true);
async function dispatch(x,y,token){
 if(stopped)return;
 const element=document.elementFromPoint(x,y);if(!element)return;
 if(element.tagName==='IFRAME'){
  const r=element.getBoundingClientRect();
  if(r.width&&r.height)element.contentWindow.postMessage({source:route,token,x:(x-r.left)/r.width,y:(y-r.top)/r.height},'*');
  return;
 }
 const canvas=element.closest?.('canvas#unity-canvas');if(!canvas||!canvas.isConnected||document.visibilityState!=='visible')return;
 const r=canvas.getBoundingClientRect();if(r.width<200||r.height<120||y<r.top+r.height*.65)return;
 const granted=await chrome.runtime.sendMessage({type:'play-claim',token,documentStartedAt:performance.timeOrigin}).catch(()=>null);
 if(!granted?.ok||stopped)return;
 // The screen can change while awaiting the worker. Recheck the exact hit target.
 if(document.elementFromPoint(x,y)!==canvas)return;
 canvas.focus();
 const init={bubbles:true,cancelable:true,clientX:x,clientY:y,button:0,pointerId:1,pointerType:'mouse',isPrimary:true};
 canvas.dispatchEvent(new PointerEvent('pointermove',{...init,buttons:0}));
 canvas.dispatchEvent(new MouseEvent('mousemove',{...init,buttons:0}));
 canvas.dispatchEvent(new PointerEvent('pointerdown',{...init,buttons:1}));
 canvas.dispatchEvent(new MouseEvent('mousedown',{...init,buttons:1}));
 setTimeout(()=>{if(!canvas.isConnected)return;canvas.dispatchEvent(new PointerEvent('pointerup',{...init,buttons:0}));canvas.dispatchEvent(new MouseEvent('mouseup',{...init,buttons:0}));canvas.dispatchEvent(new MouseEvent('click',{...init,buttons:0}));},80);
}
window.addEventListener('message',event=>{
 if(window===window.top||event.source!==window.parent||event.data?.source!==route)return;
 const {x,y,token}=event.data;if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return;
 dispatch(x*innerWidth,y*innerHeight,token).catch(()=>{});
});
if(window!==window.top)return;
async function check(){
 if(stopped)return;
 if(document.visibilityState==='visible'){
  const r=await chrome.runtime.sendMessage({type:'play-probe',documentStartedAt:performance.timeOrigin,viewport:{width:innerWidth,height:innerHeight}}).catch(()=>null);
  if(r?.done){stopped=true;return;}
  if(r?.point){await dispatch(r.point.x*innerWidth,r.point.y*innerHeight,r.token);stopped=true;return;}
 }
 setTimeout(check,1600);
}
// First response says whether this navigation belongs to a pending extraction.
check();
})();
