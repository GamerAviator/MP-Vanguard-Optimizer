export class LocalAccountRepository {async load(){const raw=localStorage.getItem('mp-vanguard-v1');return raw?normalizeState(JSON.parse(raw)):{schemaVersion:1,selected:null,accounts:[]}}async save(state){localStorage.setItem('mp-vanguard-v1',JSON.stringify(normalizeState(state)))}}
export function newAccount(name){return {id:crypto.randomUUID(),name,levels:{},resources:{pe:0,Order:0,Nature:0,Chaos:0,regatta:0,chariot:0},settings:{guildBoost:false},updatedAt:new Date().toISOString()}}

// Preserve account identities, levels and budgets while dropping obsolete discounts.
export function normalizeState(state){if(!state||!Array.isArray(state.accounts))return state;return {...state,accounts:state.accounts.map(account=>{const {eventMultiplier,...settings}=account.settings||{};return {...account,settings:{guildBoost:false,...settings}};})};}
