/* Event-driven toolbar state. No auth tokens, cookies, or network requests here. */
'use strict';
importScripts('core.js');
const C=globalThis.LimitLiveCore,KEY='limitLiveToolbar';
const ru=chrome.i18n.getUILanguage().startsWith('ru');
let queue=Promise.resolve();
const painted=new Map();
function enqueue(fn){const work=queue.then(fn);queue=work.catch(()=>{});return work;}
async function load(){const saved=(await chrome.storage.session.get(KEY))[KEY];return saved&&typeof saved==='object'?{selected:saved.selected??null,tabs:saved.tabs||{}}:{selected:null,tabs:{}};}
async function store(data){await chrome.storage.session.set({[KEY]:data});}
async function paint(state={},tabId){
  const badge=C.badge(state);const w=state.usage?.windows?.find(w=>w.kind==='weekly')||state.usage?.windows?.[0];
  const exact=w?new Intl.NumberFormat(ru?'ru':'en',{maximumFractionDigits:1}).format(w.remaining)+'%':'';
  const time=state.updatedAt?new Date(state.updatedAt).toLocaleTimeString(ru?'ru':'en',{hour:'2-digit',minute:'2-digit'}):'';
  const title=w?`Limit Live · ${ru?'осталось':'remaining'} ${exact}${badge.stale?' · '+(ru?'данные устарели':'stale data'):''}\nWork / Codex · ${time}`:`Limit Live · ${ru?'открой ChatGPT для обновления лимитов':'open ChatGPT to update allowance'}`;
  const key=tabId??'global',signature=JSON.stringify([badge.text,badge.color,title]);
  if(painted.get(key)===signature)return;
  const target=tabId===undefined?{}:{tabId};
  await Promise.all([chrome.action.setBadgeText({...target,text:badge.text}),chrome.action.setBadgeBackgroundColor({...target,color:badge.color}),chrome.action.setBadgeTextColor({...target,color:'#ffffff'}),chrome.action.setTitle({...target,title})]);
  painted.set(key,signature);
}
async function repaint(data){
  for(const [id,record] of Object.entries(data.tabs))await paint(record.state,Number(id)).catch(()=>{});
  await paint(data.tabs[data.selected]?.state||{status:'offline'});
}
const trustedPopup=sender=>sender.id===chrome.runtime.id&&sender.url===chrome.runtime.getURL('popup.html');
const trustedContent=sender=>{
  try{return sender.id===chrome.runtime.id&&sender.frameId===0&&Number.isInteger(sender.tab?.id)&&new URL(sender.url||sender.tab.url).origin==='https://chatgpt.com'}catch{return false}
};
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message?.type==='limit-live-snapshot'&&trustedContent(sender)){
    enqueue(async()=>{
      const data=await load(),id=sender.tab.id;
      data.tabs[id]={state:C.snapshot(message.state),seenAt:Date.now()};
      if(message.foreground===true||data.selected===null)data.selected=id;
      const keep=Object.entries(data.tabs).sort((a,b)=>b[1].seenAt-a[1].seenAt).slice(0,32);
      data.tabs=Object.fromEntries(keep);
      if(!data.tabs[data.selected])data.selected=id;
      await store(data);await paint(data.tabs[id].state,id);await paint(data.tabs[data.selected]?.state);
      respond({ok:true});
    }).catch(()=>respond({ok:false}));return true;
  }
  if(message?.type==='limit-live-overview'&&trustedPopup(sender)){
    enqueue(async()=>{const data=await load();const tabId=data.tabs[message.activeTabId]?message.activeTabId:data.selected;const state=data.tabs[tabId]?.state||null;await paint(data.tabs[data.selected]?.state||{status:'offline'});respond({tabId:state?Number(tabId):null,state});}).catch(()=>respond({tabId:null,state:null}));return true;
  }
  return false;
});
chrome.tabs.onActivated.addListener(info=>enqueue(async()=>{const data=await load();if(data.tabs[info.tabId]){data.selected=info.tabId;await store(data);await paint(data.tabs[info.tabId].state);}}));
chrome.tabs.onRemoved.addListener(id=>enqueue(async()=>{const data=await load();delete data.tabs[id];painted.delete(id);if(Number(data.selected)===id){const next=Object.keys(data.tabs).sort((a,b)=>data.tabs[b].seenAt-data.tabs[a].seenAt)[0];data.selected=next===undefined?null:Number(next);}await store(data);await paint(data.tabs[data.selected]?.state||{status:'offline'});}));
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status!=='loading')return;enqueue(async()=>{const data=await load();if(!data.tabs[id])return;data.tabs[id].state=C.snapshot({status:'loading'});await store(data);await paint(data.tabs[id].state,id);if(Number(data.selected)===id)await paint(data.tabs[id].state);});});
async function ensure(){await chrome.alarms.create('limit-live-freshness',{periodInMinutes:1});await repaint(await load());}
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='limit-live-freshness')enqueue(async()=>repaint(await load()));});
chrome.runtime.onInstalled.addListener(()=>enqueue(ensure));chrome.runtime.onStartup.addListener(()=>enqueue(ensure));
