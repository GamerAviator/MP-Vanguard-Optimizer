(()=>{
const budget=['pe','Order','Nature','Chaos'],resourceKeys=[...budget,'regatta','chariot','sov'];
function automatic(capture,state){
 if(capture.profileIdConflict)throw Error('Conflicting game profile IDs. Review the capture before exporting.');
 const detected=VanguardProfileIdentity.normalize(capture.gameProfileId),expected=VanguardProfileIdentity.normalize(state.expectedProfileId);if(detected&&expected&&detected!==expected)throw Error('Game profile ID differs from the ID you entered. Review the account before exporting.');
 const gameProfileId=detected||expected;
 const profile=capture.candidates.filter(e=>e.path==='result.data.GuildUnitsBit.data.UnitLevels');
 const names=new Set(),entries=[];
 for(const e of profile){const matched=state.entries.find(x=>x.gameId===e.gameId);if(!matched?.name||!VanguardNames.includes(matched.name)||names.has(matched.name))throw Error('A Vanguard ID needs review. Use the name selectors and manual export.');if(!Number.isSafeInteger(e.level)||e.level<0||e.level>100000)throw Error('An invalid level needs review.');names.add(matched.name);entries.push({gameId:e.gameId,name:matched.name,level:e.level})}
 if(!budget.every(k=>Number.isSafeInteger(capture.resources[k])&&capture.resources[k]>=0))throw Error('Some resource balances are missing. Review the capture before exporting.');
 const resources={};for(const k of resourceKeys)if(Number.isSafeInteger(capture.resources[k])&&capture.resources[k]>=0)resources[k]=capture.resources[k];
 const accountLabel=capture.accountLabel||'Chrome capture';return {format:'mp-vanguard-extract',schemaVersion:1,accountLabel,gameProfileId,profileIdSource:detected?'game':expected?'manual':null,capturedAt:capture.capturedAt,entries,resources};
}
function filename(payload){const name=payload.accountLabel.replace(/[^a-z0-9_-]+/gi,'-').replace(/^-|-$/g,'').slice(0,60)||'account';return 'vanguard-'+name+(payload.gameProfileId?'-id-'+payload.gameProfileId:'')+'-'+payload.capturedAt.slice(0,10)+'.vcef'}
globalThis.VanguardExport={automatic,filename};
})();
