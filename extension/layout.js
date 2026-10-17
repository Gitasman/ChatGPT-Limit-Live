(()=>{
'use strict';
const C=globalThis.LimitLiveCore;
class FloatingLayout {
  constructor(host,handles,read,write){
    this.host=host;this.read=read;this.write=write;this.drag=null;this.frame=null;this.pending=null;this.clickUntil=0;this.styleCache={};this.stopped=false;
    this.update=this.update.bind(this);
    for(const handle of handles){
      handle.addEventListener('pointerdown',event=>{
        if(this.stopped||event.button!==0||event.isPrimary===false||this.interactive(event,handle))return;
        const rect=host.getBoundingClientRect();this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false,original:this.read().point};
        try{handle.setPointerCapture(event.pointerId)}catch{}
        handle.focus?.({preventScroll:true});event.preventDefault();
      });
      handle.addEventListener('pointermove',event=>{
        const d=this.drag;if(!d||d.id!==event.pointerId)return;
        const dx=event.clientX-d.x,dy=event.clientY-d.y;if(Math.hypot(dx,dy)<3&&!d.moved)return;
        d.moved=true;this.host.dataset.dragging='yes';this.pending={x:d.left+dx,y:d.top+dy};
        if(typeof requestAnimationFrame==='function'){if(this.frame===null)this.frame=requestAnimationFrame(()=>{this.frame=null;this.flush()})}else this.flush();
      });
      const finish=(event,cancel=false)=>{
        const d=this.drag;if(!d||d.id!==event.pointerId)return;
        if(cancel){this.pending=null;this.cancelFrame()}else this.flush();
        this.drag=null;this.host.dataset.dragging='no';
        try{handle.releasePointerCapture(event.pointerId)}catch{}
        if(cancel){this.write({point:d.original},false);this.update()}else if(d.moved){this.clickUntil=Date.now()+350;this.write({point:this.read().point},true);}
      };
      handle.addEventListener('pointerup',e=>finish(e));handle.addEventListener('pointercancel',e=>finish(e,true));handle.addEventListener('lostpointercapture',e=>finish(e));
      handle.addEventListener('click',event=>{if(Date.now()<this.clickUntil){this.clickUntil=0;event.preventDefault();event.stopImmediatePropagation?.();}},true);
      handle.addEventListener('keydown',event=>{
        if(this.interactive(event,handle))return;
        if(event.key==='Home'){event.preventDefault();this.write({point:null},true);this.update();return;}
        const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!dir)return;
        event.preventDefault();const rect=host.getBoundingClientRect(),step=event.shiftKey?40:10;this.move(rect.left+dir[0]*step,rect.top+dir[1]*step,true);
      });
    }
    window.addEventListener('resize',this.update);window.visualViewport?.addEventListener('resize',this.update);window.visualViewport?.addEventListener('scroll',this.update);
    if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(this.update);this.observer.observe(host);}
  }
  interactive(event,handle){return (event.composedPath?.()||[event.target]).some(node=>node&&node!==handle&&node.matches?.('button,a,input,select,textarea,summary,[contenteditable=true]'));}
  cancelFrame(){if(this.frame!==null&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(this.frame);this.frame=null;}
  flush(){this.cancelFrame();if(!this.pending)return;const p=this.pending;this.pending=null;this.move(p.x,p.y,false);}
  css(key,value){if(this.styleCache[key]===value)return;this.styleCache[key]=value;this.host.style.setProperty(key,value);}
  viewport(){const v=window.visualViewport;return {width:v?.width||window.innerWidth,height:v?.height||window.innerHeight,x:v?.offsetLeft||0,y:v?.offsetTop||0};}
  size(){const r=this.host.getBoundingClientRect();return {width:r.width,height:r.height};}
  update(){
    const v=this.viewport();this.css('--viewport-w',v.width+'px');this.css('--viewport-h',v.height+'px');
    const cfg=this.read();const p=C.place(cfg.point||{x:cfg.position==='left'?0:1,y:1},this.size(),v);
    this.css('left',p.x+'px');this.css('top',p.y+'px');this.css('right','auto');this.css('bottom','auto');
  }
  move(x,y,persist){this.write({point:C.anchor({x,y},this.size(),this.viewport())},persist);this.update();}
  destroy(){this.stopped=true;this.pending=null;this.cancelFrame();this.observer?.disconnect();window.removeEventListener('resize',this.update);window.visualViewport?.removeEventListener('resize',this.update);window.visualViewport?.removeEventListener('scroll',this.update);}
}
globalThis.LimitLiveLayout=FloatingLayout;
})();
