'use strict';
const C=globalThis.LimitLiveCore,UI=globalThis.LimitLiveUI,t=UI.t;
let cfg=C.settings(),savedCfg=cfg,state=null,saving=0,revision=0,sizeTimer=null,writes=Promise.resolve();
const htmlCache=new Map();
function setHTML(id,markup){if(htmlCache.get(id)===markup)return false;htmlCache.set(id,markup);document.getElementById(id).innerHTML=markup;return true;}
document.documentElement.lang=UI.ru?'ru':'en';
const style=document.createElement('style');style.textContent=UI.styles;document.head.appendChild(style);
const app=document.getElementById('app');
app.innerHTML=`<header class="header"><div class="brand"><span class="brand-mark">${UI.svg('logo')}</span><span class="brand-name">Limit Live</span></div><button id="settings" class="icon-button" aria-label="${t.settings}" title="${t.settings}" aria-expanded="false">${UI.svg('gear')}</button></header><div class="scope"><span>Work / Codex</span><span id="plan" class="plan"></span></div><div id="meters"></div><div id="additional" class="additional"></div><footer class="footer"><span id="status" class="status" role="status"></span><span id="checked" class="version"></span></footer><div id="error" class="error" role="status"></div><section class="preferences"><div class="control-heading">${t.display}</div><div class="segments mode" role="group" aria-label="${t.display}"><button id="modePanel">${t.panel}</button><button id="modeCompact">${t.compact}</button><button id="modeIcon">${t.iconOnly}</button></div></section>${UI.sizeControl()}<div id="prefsHolder"></div><a id="open" class="open-link" href="https://chatgpt.com/" target="_blank" rel="noreferrer">${t.open}${UI.svg('arrow')}</a><p id="pin" class="note pin-note">${t.pin}</p>`;
document.getElementById('prefsHolder').innerHTML=UI.controls({mode:false});
const q=id=>document.getElementById(id);
function render(){
  document.documentElement.dataset.theme=cfg.theme;
  const info=C.badge(state||{});
  q('plan').textContent=state?.usage?.plan||'';
  setHTML('meters',state?.usage?UI.meters(state.usage):`<p class="empty">${UI.esc(state?t[state.status]||t.loading:t.noTab)}</p>`);
  const open=q('additional').querySelector('details')?.open;
  const changed=setHTML('additional',state?.usage?.additional?.length?`<details><summary>${t.additional}</summary>${state.usage.additional.map(p=>`<h4>${UI.esc(p.name)}</h4>${UI.meters(p)}`).join('')}</details>`:'');if(changed&&open){const details=q('additional').querySelector('details');if(details)details.open=true;}
  q('status').textContent=state?.usage?(info.stale?t.stale:t.auto):(state?t[state.status]||t.loading:t.empty);q('status').dataset.stale=info.stale?'yes':'no';
  q('checked').textContent=state?.updatedAt?new Date(state.updatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';
  q('checked').title=state?.updatedAt?`${t.source} · ${new Date(state.updatedAt).toLocaleString()}`:'';
  UI.setControls(document,cfg);q('diameter').value=String(cfg.diameter);if(document.activeElement!==q('diameterNumber'))q('diameterNumber').value=String(cfg.diameter);q('diameterValue').textContent=cfg.diameter+' px';
  const colors=UI.effectiveColors(cfg);q('contrastHint').textContent=((cfg.backgroundOpacity===100&&C.contrast(colors.percent,colors.background)<4.5)||C.contrast(colors.pillText,colors.pill)<4.5||C.contrast(colors.tooltipText,colors.tooltip)<4.5)?t.lowContrast:'';
}
function persist(patch){
  cfg=C.settings({...cfg,...patch});const desired=cfg,current=++revision;render();
  const write=async()=>{
    saving++;
    try{await chrome.storage.local.set({limitLiveSettings:desired});savedCfg=desired;if(current===revision)q('error').textContent='';}
    catch{if(current===revision){cfg=savedCfg;q('error').textContent=t.notSaved;}}
    finally{saving--;render();}
  };
  writes=writes.then(write,write);return writes;
}
for(const mode of ['Panel','Compact','Icon'])q('mode'+mode).onclick=()=>persist({hidden:mode==='Icon',collapsed:mode==='Compact'});
for(const key of ['theme','position'])q(key).onchange=e=>persist({[key]:e.target.value,...(key==='position'?{point:null}:{})});
function numericChange(key,event){
  const spec=key==='diameter'?{min:48,max:320}:UI.numericControls[key],raw=String(event.target.value),value=Number(raw);
  if(!raw.trim()||!Number.isFinite(value)||value<spec.min||value>spec.max){event.target.setAttribute?.('aria-invalid','true');q('error').textContent=`${t.invalidValue}: ${spec.min}–${spec.max}`;return Promise.resolve(false);}
  event.target.setAttribute?.('aria-invalid','false');const result=persist({[key]:key==='numberScale'?value/100:value});event.target.value=String(key==='numberScale'?Math.round(cfg.numberScale*100):cfg[key]);return result;
}
for(const key of Object.keys(UI.numericControls))q(key).onchange=e=>numericChange(key,e);
for(const key of ['decimals','fontWeight'])q(key).onchange=e=>persist({[key]:Number(e.target.value)});
for(const key of UI.toggles)q(key).onchange=e=>persist({[key]:e.target.checked});
for(const key of C.COLOR_KEYS){
  const commit=event=>{const value=C.color(event.target.value);if(!value){event.target.setAttribute?.('aria-invalid','true');q('error').textContent=t.invalidColor;return Promise.resolve(false);}event.target.setAttribute?.('aria-invalid','false');event.target.value=value;return persist({colorOverrides:{...cfg.colorOverrides,[key]:value}});};
  q('color_'+key).onchange=commit;q('hex_'+key).onchange=commit;
}
q('resetColors').onclick=()=>persist({colorOverrides:{}});
q('presetDark').onclick=()=>persist({theme:'dark',colorOverrides:{}});q('presetLight').onclick=()=>persist({theme:'light',colorOverrides:{}});
q('restore').onclick=()=>persist(C.resetAppearance(cfg));q('dock').onclick=()=>persist({point:null});
q('diameter').oninput=e=>{cfg=C.settings({...cfg,diameter:Number(e.target.value)});q('diameterNumber').value=String(cfg.diameter);q('diameterValue').textContent=cfg.diameter+' px';clearTimeout(sizeTimer);sizeTimer=setTimeout(()=>{sizeTimer=null;persist({diameter:cfg.diameter})},120);};
q('diameter').onchange=e=>{clearTimeout(sizeTimer);sizeTimer=null;return numericChange('diameter',e)};
q('diameterNumber').onchange=e=>{clearTimeout(sizeTimer);sizeTimer=null;return numericChange('diameter',e)};
globalThis.addEventListener?.('pagehide',()=>{if(sizeTimer!==null){clearTimeout(sizeTimer);sizeTimer=null;persist({diameter:cfg.diameter})}});
q('settings').onclick=()=>{q('prefs').hidden=!q('prefs').hidden;q('settings').setAttribute('aria-expanded',String(!q('prefs').hidden));};
async function refresh(){
  try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const data=await chrome.runtime.sendMessage({type:'limit-live-overview',activeTabId:tab?.id});state=data?.state||null;render();}catch{state=null;render();}
}
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.limitLiveSettings&&!saving){cfg=C.settings(changes.limitLiveSettings.newValue);savedCfg=cfg;render()}});
(async()=>{try{cfg=C.settings((await chrome.storage.local.get('limitLiveSettings')).limitLiveSettings);savedCfg=cfg;}catch{}render();refresh();try{const pinned=await chrome.action.getUserSettings();q('pin').hidden=!!pinned.isOnToolbar}catch{}setInterval(refresh,3000)})();
