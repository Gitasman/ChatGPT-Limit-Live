/* ChatGPT Limit Live — MIT. Internal usage endpoint adapter; no guessed quotas. */
(function(root){
'use strict';
const valid=(n)=>typeof n==='number'&&Number.isFinite(n);
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
  return {plan:typeof raw.plan_type==='string'?raw.plan_type.slice(0,40):'',windows:main,additional};
}
function settings(input={}) {
  const s=input&&typeof input==='object'?input:{};
  const point=s.point&&valid(s.point.x)&&valid(s.point.y)&&s.point.x>=0&&s.point.x<=1&&s.point.y>=0&&s.point.y<=1?{x:s.point.x,y:s.point.y}:null;
  const diameter=valid(s.diameter)&&s.diameter>=96&&s.diameter<=240?Math.round(s.diameter/4)*4:Math.round(148*([.9,1,1.1].includes(s.scale)?s.scale:1)/4)*4;
  return {diameter,theme:['system','light','dark'].includes(s.theme)?s.theme:'system',scale:[0.9,1,1.1].includes(s.scale)?s.scale:1,position:['left','right'].includes(s.position)?s.position:'right',interval:[30,60,120].includes(s.interval)?s.interval:30,collapsed:s.collapsed===true,hidden:s.hidden===true,point};
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
  const usage=windows.length?{plan:String(input.usage.plan||'').slice(0,40),windows,additional:(Array.isArray(input.usage.additional)?input.usage.additional:[]).slice(0,12).map(p=>({name:String(p.name||'').slice(0,80),windows:cleanRows(p.windows)})).filter(p=>p.windows.length)}:null;
  return {status:statuses.includes(input.status)?input.status:'loading',usage,updatedAt:valid(input.updatedAt)&&input.updatedAt>0&&input.updatedAt<Date.now()+60000?input.updatedAt:0,interval:[30,60,120].includes(input.interval)?input.interval:30};
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
const api={normalize,settings,identity,Monitor,place,anchor,snapshot,badge};root.LimitLiveCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
