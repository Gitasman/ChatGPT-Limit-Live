/* Hover/focus details are rendered only while open and never change drag bounds. */
(()=>{
'use strict';
class HoverDetails {
  constructor(host,targets,tip,state,settings){
    this.host=host;this.targets=targets;this.tip=tip;this.state=state;this.settings=settings;this.open=false;this.tip.hidden=true;this.hovered=false;this.dismissed=false;this.active=targets[0];this.showTimer=null;this.hideTimer=null;this.markup='';
    for(const target of targets){
      target.addEventListener('pointerenter',()=>{this.hovered=true;this.dismissed=false;this.active=target;this.schedule()});
      target.addEventListener('pointerleave',()=>{this.hovered=false;this.dismissed=false;this.scheduleHide()});
      target.addEventListener('focusin',()=>{this.active=target;this.schedule()});
      target.addEventListener('focusout',()=>this.scheduleHide());
      target.addEventListener('pointerdown',()=>this.hide());
      target.addEventListener('pointerup',()=>{if(this.hovered)this.schedule()});
    }
    tip.addEventListener('pointerenter',()=>{clearTimeout(this.hideTimer);this.hideTimer=null});
    tip.addEventListener('pointerleave',()=>this.scheduleHide());
    host.addEventListener('keydown',e=>{if(e.key==='Escape'&&(this.open||this.showTimer!==null)){this.dismissed=true;this.hide();e.stopPropagation?.()}});
    this.position=this.position.bind(this);window.addEventListener('resize',this.position);window.visualViewport?.addEventListener('resize',this.position);window.visualViewport?.addEventListener('scroll',this.position);
  }
  allowed(){const cfg=this.settings();return cfg.tooltip&&!cfg.hidden&&!this.dismissed&&this.host.dataset.dragging!=='yes';}
  schedule(){clearTimeout(this.hideTimer);this.hideTimer=null;if(!this.allowed())return;if(this.open){this.update();return;}if(this.showTimer!==null)return;this.showTimer=setTimeout(()=>{this.showTimer=null;if(!this.allowed())return;this.open=true;this.tip.hidden=false;this.update()},this.settings().tooltipDelay);}
  scheduleHide(){clearTimeout(this.showTimer);this.showTimer=null;clearTimeout(this.hideTimer);this.hideTimer=setTimeout(()=>this.hide(),140);}
  hide(){clearTimeout(this.showTimer);clearTimeout(this.hideTimer);this.showTimer=null;this.hideTimer=null;this.open=false;this.tip.hidden=true;}
  update(){if(!this.open)return;if(!this.allowed()){this.hide();return;}const markup=globalThis.LimitLiveUI.tooltipHTML(this.state());if(markup!==this.markup){this.tip.innerHTML=markup;this.markup=markup;}this.position();}
  position(){if(!this.open)return;const view=window.visualViewport;const viewport={width:view?.width||window.innerWidth,height:view?.height||window.innerHeight,x:view?.offsetLeft||0,y:view?.offsetTop||0};const r=this.tip.getBoundingClientRect(),p=globalThis.LimitLiveCore.tooltipPlace(this.active.getBoundingClientRect(),{width:r.width,height:r.height},viewport);this.tip.style.setProperty('left',p.x+'px');this.tip.style.setProperty('top',p.y+'px');}
  destroy(){this.dismissed=true;this.hide();window.removeEventListener('resize',this.position);window.visualViewport?.removeEventListener('resize',this.position);window.visualViewport?.removeEventListener('scroll',this.position);}
}
globalThis.LimitLiveTooltip=HoverDetails;
})();
