/* ChatGPT Limit Live — MIT. Internal usage endpoint adapter; no guessed quotas. */
(function(root){
'use strict';
const valid=(n)=>typeof n==='number'&&Number.isFinite(n);
function resetCredits(raw){
  if(!Number.isSafeInteger(raw?.available_count)||raw.available_count<0||raw.available_count>1000000)return null;
  const detailsKnown=Array.isArray(raw.credits);
  const details=(detailsKnown?raw.credits:[]).slice(0,100).filter(c=>c?.status==='available').slice(0,20).map(c=>({title:typeof c.title==='string'?c.title.slice(0,80):'',expiresAt:typeof c.expires_at==='string'&&Number.isFinite(Date.parse(c.expires_at))?Date.parse(c.expires_at):null}));
  return {available:raw.available_count,detailsKnown,details};
}
function resetWire(resets){return resets?{available_count:resets.available,...(resets.detailsKnown?{credits:resets.details.map(c=>({status:'available',title:c.title,expires_at:c.expiresAt?new Date(c.expiresAt).toISOString():null}))}:{})}:undefined;}
function normalize(raw,now=Date.now()) {
  function windows(pool) {
    return ['primary_window','secondary_window'].flatMap(slot=>{
      const w=pool?.[slot]; if(!w)return [];
      const used=w.used_percent;
      if(!valid(used)||used<0||used>100) return [];
      const seconds=valid(w.limit_window_seconds)&&w.limit_window_seconds>0?w.limit_window_seconds:null;
      const kind=seconds===604800?'weekly':seconds===18000?'fiveHour':seconds?'other':'unknown';
      let resetAt=null;
      if(valid(w.reset_at)&&w.reset_at>0)resetAt=w.reset_at*1000;
      else if(valid(w.reset_after_seconds)&&w.reset_after_seconds>=0)resetAt=now+w.reset_after_seconds*1000;
      return [{kind,seconds,remaining:100-used,used,resetAt}];
    }).sort((a,b)=>(b.seconds||0)-(a.seconds||0));
  }
  const main=windows(raw?.rate_limit);
  if(!main.length)throw Object.assign(new Error('Unsupported usage response'),{code:'schema'});
  const additional=(Array.isArray(raw.additional_rate_limits)?raw.additional_rate_limits:[]).slice(0,12).map(p=>({name:String(p.limit_name||p.metered_feature||'Additional').slice(0,80),windows:windows(p.rate_limit)})).filter(p=>p.windows.length);
  return {plan:typeof raw.plan_type==='string'?raw.plan_type.slice(0,40):'',windows:main,additional,resets:resetCredits(raw.rate_limit_reset_credits)};
}
const COLOR_KEYS=['percent','ring','background','pill','pillText','tooltip','tooltipText','tooltipBorder','track','warning','critical'];
const DARK_COLORS={percent:'#d4d4d4',ring:'#9b9b9b',background:'#181818',pill:'#202020',pillText:'#d4d4d4',tooltip:'#202020',tooltipText:'#dedede',tooltipBorder:'#383838',track:'#353535',warning:'#edbf6b',critical:'#ff91aa'};
const LIGHT_COLORS={percent:'#24242b',ring:'#35353e',background:'#ffffff',pill:'#f4f4f6',pillText:'#24242b',tooltip:'#ffffff',tooltipText:'#24242b',tooltipBorder:'#dedee3',track:'#e9e9ed',warning:'#926414',critical:'#b32947'};
function color(value){
  if(typeof value!=='string')return null;
  const hex=value.trim().toLowerCase();
  if(/^#[0-9a-f]{6}$/.test(hex))return hex;
  if(/^#[0-9a-f]{3}$/.test(hex))return '#'+hex.slice(1).split('').map(x=>x+x).join('');
  return null;
}
function palette(theme,dark=true){return {...(theme==='light'||theme==='system'&&!dark?LIGHT_COLORS:DARK_COLORS)};}
function settings(input={}) {
  const s=input&&typeof input==='object'?input:{};
  const bounded=(key,min,max,fallback)=>valid(s[key])&&s[key]>=min&&s[key]<=max?s[key]:fallback;
  const point=s.point&&valid(s.point.x)&&valid(s.point.y)&&s.point.x>=0&&s.point.x<=1&&s.point.y>=0&&s.point.y<=1?{x:s.point.x,y:s.point.y}:null;
  const legacy=s.appearanceVersion!==3;
  const previousDefault=legacy&&(s.diameter===90||s.appearanceVersion!==2&&s.diameter===148);
  const sourceDiameter=previousDefault?50:valid(s.diameter)?s.diameter:[.9,1.1].includes(s.scale)?Math.round(148*s.scale/4)*4:50;
  const diameter=Math.round(Math.max(32,Math.min(150,sourceDiameter)));
  const theme=['system','light','dark'].includes(s.theme)?(s.appearanceVersion!==2&&s.appearanceVersion!==3&&s.theme==='system'?'dark':s.theme):'dark';
  const source=s.colorOverrides&&typeof s.colorOverrides==='object'?s.colorOverrides:(s.colors&&typeof s.colors==='object'?s.colors:{});
  const colorOverrides={};for(const key of COLOR_KEYS){const value=color(source[key]);if(value)colorOverrides[key]=value;}
  const colors={...palette(theme),...colorOverrides};
  return {appearanceVersion:3,diameter,theme,scale:[.9,1,1.1].includes(s.scale)?s.scale:1,position:['left','right'].includes(s.position)?s.position:'right',interval:Math.round(bounded('interval',30,300,30)),collapsed:s.collapsed===true,hidden:s.hidden===true,point,
    colors,colorOverrides,ringWidth:Math.min(Math.floor(diameter/4)/2,bounded('ringWidth',1,12,3)),numberScale:bounded('numberScale',.22,.48,.34),decimals:[0,1,2].includes(s.decimals)?s.decimals:1,
    backgroundOpacity:bounded('backgroundOpacity',0,100,100),fontWeight:[400,500,600,700].includes(s.fontWeight)?s.fontWeight:600,roundCaps:s.roundCaps!==false,track:s.track===true,shadow:s.shadow===true,adaptiveColors:s.adaptiveColors===true,tooltip:s.tooltip!==false,tooltipDelay:Math.round(bounded('tooltipDelay',0,1500,250))};
}
function resetAppearance(input){const previous=settings(input);return settings({...previous,appearanceVersion:3,diameter:50,theme:'dark',scale:1,ringWidth:3,numberScale:.34,decimals:1,backgroundOpacity:100,fontWeight:600,roundCaps:true,track:false,shadow:false,adaptiveColors:false,tooltip:true,tooltipDelay:250,colorOverrides:{}});}
function contrast(foreground,background){
  const luminance=hex=>{const c=color(hex);if(!c)return 0;const rgb=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
function tooltipPlace(rect,size,viewport){
  const originX=viewport.x||0,originY=viewport.y||0,left=originX+12,top=originY+12;
  const maxX=Math.max(left,originX+viewport.width-size.width-12),maxY=Math.max(top,originY+viewport.height-size.height-12);
  const above=rect.top-size.height-10;
  return {x:Math.round(Math.max(left,Math.min(maxX,rect.left+rect.width/2-size.width/2))),y:Math.round(Math.max(top,Math.min(maxY,above>=top?above:rect.top+rect.height+10)))};
}
function bounds(size,viewport) {
  const x=(viewport.x||0)+12,y=(viewport.y||0)+12;
  return {x,y,width:Math.max(0,viewport.width-size.width-24),height:Math.max(0,viewport.height-size.height-24)};
}
function place(point,size,viewport) {const b=bounds(size,viewport);return {x:Math.round(b.x+b.width*(point?.x??1)),y:Math.round(b.y+b.height*(point?.y??1))};}
function anchor(pixel,size,viewport) {const b=bounds(size,viewport);const clamp=n=>Math.max(0,Math.min(1,n));return {x:b.width?clamp((pixel.x-b.x)/b.width):0,y:b.height?clamp((pixel.y-b.y)/b.height):0};}
function snapshot(input={}) {
  input=input&&typeof input==='object'?input:{};
  const statuses=['loading','switching','current','signedOut','forbidden','limited','unsupported','identity','offline'];
  const cleanRows=rows=>(Array.isArray(rows)?rows:[]).slice(0,2).filter(w=>valid(w?.remaining)&&w.remaining>=0&&w.remaining<=100).map(w=>({kind:['weekly','fiveHour','other','unknown'].includes(w.kind)?w.kind:'unknown',seconds:valid(w.seconds)&&w.seconds>0?w.seconds:null,remaining:w.remaining,used:100-w.remaining,resetAt:valid(w.resetAt)&&w.resetAt>0?w.resetAt:null}));
  const windows=cleanRows(input.usage?.windows);
  const r=input.usage?.resets;
  const safeResets=r&&Number.isSafeInteger(r.available)&&r.available>=0&&r.available<=1000000?resetCredits({available_count:r.available,...(r.detailsKnown&&Array.isArray(r.details)?{credits:r.details.slice(0,20).map(c=>({status:'available',title:c?.title,expires_at:valid(c?.expiresAt)&&c.expiresAt>0&&c.expiresAt<8640000000000000?new Date(c.expiresAt).toISOString():null}))}:{})}):null;
  const usage=windows.length?{plan:String(input.usage.plan||'').slice(0,40),windows,additional:(Array.isArray(input.usage.additional)?input.usage.additional:[]).slice(0,12).map(p=>({name:String(p.name||'').slice(0,80),windows:cleanRows(p.windows)})).filter(p=>p.windows.length),resets:safeResets}:null;
  return {status:statuses.includes(input.status)?input.status:'loading',usage,updatedAt:valid(input.updatedAt)&&input.updatedAt>0&&input.updatedAt<Date.now()+60000?input.updatedAt:0,interval:valid(input.interval)&&input.interval>=30&&input.interval<=300?Math.round(input.interval):30};
}
function badge(state={},now=Date.now()) {
  const w=state.usage?.windows?.find(w=>w.kind==='weekly')||state.usage?.windows?.[0];
  const stale=!!w&&(state.status!=='current'||!state.updatedAt||now-state.updatedAt>Math.max((state.interval||30)*2500,90000)||state.usage.windows.some(row=>row.resetAt!==null&&row.resetAt<=now));
  if(!w)return {text:['loading','switching'].includes(state.status)?'…':'—',color:'#656570',stale:true};
  if(stale)return {text:'?',color:'#8a6117',stale:true};
  return {text:w.remaining===100?'100%':w.remaining>0&&w.remaining<1?'<1%':Math.floor(w.remaining)+'%',color:w.remaining<=10?'#ad2944':w.remaining<=30?'#8a6117':'#35353e',stale:false};
}
function identity(s,hint) {
  const token=s?.accessToken||s?.access_token;
  const user=s?.user?.id;
  let claim=null;
  try {const encoded=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const payload=JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length/4)*4,'=')));claim=payload['https://api.openai.com/auth']?.chatgpt_account_id||null;}catch{}
  const account=hint||s?.account?.id||s?.account?.account_id||s?.accountId||s?.account_id||claim;
  if(typeof token!=='string'||!token||typeof user!=='string'||!user)throw Object.assign(new Error('Sign in'),{status:401});
  if(typeof account!=='string'||!account)throw Object.assign(new Error('Account context unavailable'),{code:'identity'});
  return {key:JSON.stringify([user,account]),user,account,token};
}
class Monitor {
  constructor(io) {this.io=io;this.epoch=0;this.hint=null;this.user=null;this.key=null;this.failures=0;this.busy=null;this.controller=null;this.state={usage:null,status:'loading',updatedAt:0,retryAt:0,code:null};}
  emit(patch){Object.assign(this.state,patch);this.io.changed?.({...this.state});}
  invalidate(hint=null) {this.epoch++;this.hint=hint;this.key=null;this.controller?.abort();this.emit({usage:null,status:'switching',updatedAt:0});}
  async refresh() {
    if(this.busy)return this.busy;
    if(Date.now()<this.state.retryAt)return;
    this.busy=this.run().finally(()=>{this.busy=null;});return this.busy;
  }
  async run() {
    const epoch=this.epoch;const controller=new AbortController();this.controller=controller;
    let confirmed=false;
    const current=()=>epoch===this.epoch&&!controller.signal.aborted;
    try {
      const session=await this.io.session(controller.signal);
      if(!current())return;
      // A hint from the previous logged-in user must never override a new session.
      if(this.user&&session?.user?.id!==this.user)this.hint=null;
      const auth=identity(session,this.hint);this.user=auth.user;
      if(this.key!==auth.key){this.key=auth.key;this.emit({usage:null,updatedAt:0,status:'loading'});}
      confirmed=true;
      const result=await this.io.usage(auth,controller.signal);
      if(!current())return;
      const after=identity(await this.io.session(controller.signal),this.hint);
      if(!current())return;
      if(after.key!==auth.key){this.invalidate();return;}
      const usage=result.normalized||normalize(result);
      const updatedAt=result.updatedAt||Date.now();this.failures=0;
      this.emit({usage,updatedAt,status:'current',retryAt:0,code:null,accountSuffix:auth.account.slice(-6)});
    } catch(error) {
      if(!current())return;
      this.failures++;
      const wait=Math.max(30000*Math.pow(2,Math.min(this.failures-1,4)),Math.min(Number(error.retryAfter)||0,86400000));
      const status=error.status===401?'signedOut':error.status===403?'forbidden':error.status===429?'limited':error.code==='schema'?'unsupported':error.code==='identity'?'identity':'offline';
      this.emit({usage:confirmed&&![401,403].includes(error.status)?this.state.usage:null,status,retryAt:Date.now()+wait,code:error.code||error.status||'network'});
    } finally {if(this.controller===controller)this.controller=null;}
  }
}
const api={normalize,settings,identity,Monitor,place,anchor,snapshot,badge,color,contrast,resetAppearance,tooltipPlace,COLOR_KEYS,palette,resetCredits,resetWire};root.LimitLiveCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
