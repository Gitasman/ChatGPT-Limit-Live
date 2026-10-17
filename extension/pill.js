/* Capsule progress uses real layout bounds; geometry only changes on size/stroke changes. */
(()=>{
'use strict';
const C=globalThis.LimitLiveCore;
class PillRing {
  constructor(shell,svg,track,progress){
    this.shell=shell;this.svg=svg;this.track=track;this.progress=progress;this.size=null;this.model=null;this.cfg=null;this.key='';this.attrs=new WeakMap();this.stopped=false;
    if(typeof ResizeObserver==='function'){
      this.observer=new ResizeObserver(entries=>{
        if(this.stopped)return;
        const rect=entries.find(entry=>entry.target===shell)?.contentRect;
        if(rect?.width>0&&rect.height>0){this.size={width:rect.width,height:rect.height};this.paint();}
      });this.observer.observe(shell);
    }
  }
  active(){return this.cfg?.collapsed&&!this.cfg.hidden;}
  attr(node,key,value){
    let values=this.attrs.get(node);if(!values){values=new Map();this.attrs.set(node,values);}
    value=String(value);if(values.get(key)===value)return;values.set(key,value);node.setAttribute(key,value);
  }
  update(model,cfg){
    if(this.stopped)return;this.model=model;this.cfg=cfg;
    this.shell.dataset.stale=model.stale?'yes':'no';this.shell.dataset.shadow=cfg.shadow?'yes':'no';
    if(!this.active())return;
    if(!this.observer||!this.size){const rect=this.shell.getBoundingClientRect();if(rect.width>0&&rect.height>0)this.size={width:rect.width,height:rect.height};}
    this.paint();
  }
  paint(){
    if(this.stopped||!this.active()||!this.size||!this.model)return;
    const g=C.pillGeometry(this.size.width,this.size.height,this.cfg.ringWidth);if(!g)return;
    const key=[g.width,g.height,g.stroke].join(':');
    if(key!==this.key){
      this.key=key;this.attr(this.svg,'viewBox',`0 0 ${g.width} ${g.height}`);
      for(const path of [this.track,this.progress]){this.attr(path,'d',g.path);this.attr(path,'stroke-width',g.stroke);}
    }
    const remaining=Number.isFinite(this.model.progress)?Math.max(0,Math.min(100,this.model.progress)):0;
    this.attr(this.progress,'stroke-dashoffset',100-remaining);this.attr(this.progress,'visibility',remaining>0?'visible':'hidden');
    this.attr(this.progress,'stroke-linecap',this.cfg.roundCaps&&remaining>0&&remaining<100?'round':'butt');
    this.attr(this.track,'visibility',this.cfg.track?'visible':'hidden');
  }
  destroy(){this.stopped=true;this.observer?.disconnect();}
}
globalThis.LimitLivePill=PillRing;
})();
