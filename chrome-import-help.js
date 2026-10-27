import {chromeImportGuideHTML} from './chrome-import-guide.js';
const root=document.querySelector('#chrome-guide-page');
root.innerHTML=chromeImportGuideHTML;
const close=root.querySelector('.chrome-guide-header [data-close-guide]');
const app=document.createElement('a');app.className='button';app.href='./index.html';app.target='_blank';app.rel='noopener';app.textContent='Open optimizer ↗';close.replaceWith(app);
root.querySelector('.chrome-guide-footer').innerHTML='<span>Keep these instructions beside the game or optimizer. Close this window when finished.</span>';
