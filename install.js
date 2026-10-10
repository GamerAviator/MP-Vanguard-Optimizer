export function installPlatform(nav){const ua=nav.userAgent||'';if(/iPad|iPhone|iPod/i.test(ua)||nav.platform==='MacIntel'&&nav.maxTouchPoints>1)return 'ios';if(/Android/i.test(ua))return 'android';if(/Mac/i.test(nav.platform||ua))return 'mac';return 'desktop'}
export function setupInstallGuide(doc=document,win=window,nav=navigator){
 const button=doc.querySelector('#install'),guide=doc.querySelector('#install-guide'),hint=doc.querySelector('#install-hint'),status=doc.querySelector('#install-status');
 const tabs=Array.from(doc.querySelectorAll('[data-install-device]'));
 let prompt=null,current=installPlatform(nav);
 const hints={ios:'iPhone / iPad: open in Safari → Share → Add to Home Screen.',android:'Android: open in Chrome → menu ⋮ → Install and create shortcut → Install.',mac:'Mac: open in Safari → File → Add to Dock.',desktop:'Desktop: use the install icon in Chrome or Edge’s address bar.'};
 const installed=()=>Boolean(nav.standalone||win.matchMedia?.('(display-mode: standalone)').matches);
 function select(device){current=device;hint.textContent=hints[device];for(const tab of tabs){const selected=tab.dataset.installDevice===device;tab.classList.toggle('active',selected);tab.setAttribute('aria-pressed',String(selected))}doc.querySelectorAll('[data-install-steps]').forEach(panel=>panel.hidden=panel.dataset.installSteps!==device)}
 function markInstalled(){button.disabled=true;button.querySelector('span').firstChild.textContent='App installed';button.querySelector('small').textContent='You’re using the app';status.textContent='The app is installed. Open it from your home screen, Dock, or app launcher.';guide.open=false;prompt=null}
 function showGuide(message='Follow the steps below to add Vanguard Optimizer to your device.'){status.textContent=message;guide.open=true;guide.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
 tabs.forEach(tab=>tab.onclick=()=>select(tab.dataset.installDevice));select(current);
 win.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.querySelector('small').textContent='Ready to install on this device'});
 win.addEventListener('appinstalled',markInstalled);
 button.onclick=async()=>{if(installed()){markInstalled();return}if(!prompt){showGuide();return}const event=prompt;prompt=null;try{await event.prompt();const choice=await event.userChoice;if(choice?.outcome==='accepted'){if(installed())markInstalled();else status.textContent='Installation requested. Finish the browser’s installation steps.'}else showGuide('You can install later using the browser menu. Steps are below.')}catch{showGuide('Use your browser’s menu to install. Steps are below.')}};
 if(installed())markInstalled();
 return {select,showGuide};
}
