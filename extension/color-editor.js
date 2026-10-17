/* Inline color controls: no OS picker, implicit modal state or HTML replacement. */
(()=>{
'use strict';
const C=globalThis.LimitLiveCore,UI=globalThis.LimitLiveUI,t=UI.t;
class ColorEditor {
  constructor(root,getSettings,save,flush,error){
    this.root=root;this.q=id=>root.getElementById(id);this.getSettings=getSettings;this.save=save;this.flush=flush;this.error=error;this.key=null;this.picker=null;
    for(const key of C.COLOR_KEYS){
      this.q('color_'+key).onclick=()=>this.open(key);
      const input=this.q('hex_'+key);
      input.oninput=e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))return this.commit(key,e.target.value,120);};
      input.onchange=e=>{const result=this.commit(key,e.target.value);if(C.color(e.target.value))e.target.value=C.color(e.target.value);return result;};
      input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(C.color(input.value)){this.commit(key,input.value);return this.close();}}};
    }
    for(const [i,channel] of ['R','G','B'].entries()){
      const input=this.q('color'+channel);
      input.oninput=e=>{
        if(!this.key)return;
        const n=Number(e.target.value);if(!Number.isInteger(n)||n<0||n>255)return;
        const rgb=UI.effectiveColors(this.getSettings())[this.key].slice(1).match(/../g);rgb[i]=n.toString(16).padStart(2,'0');
        return this.commit(this.key,'#'+rgb.join(''),120);
      };
      input.onchange=()=>this.flush();
    }
    UI.colorSamples.forEach((hex,i)=>this.q('colorSample'+i).onclick=()=>this.key&&this.commit(this.key,hex));
    this.q('colorDefault').onclick=()=>{if(!this.key)return;const colorOverrides={...this.getSettings().colorOverrides};delete colorOverrides[this.key];return this.save({colorOverrides});};
    this.q('colorDone').onclick=()=>this.close();
    this.q('colorEyeDropper').hidden=typeof globalThis.EyeDropper!=='function';
    this.q('colorEyeDropper').onclick=()=>this.pick();
    this.keydown=e=>{if(e.key==='Escape'&&this.key){e.preventDefault();e.stopPropagation();this.close();}};root.addEventListener?.('keydown',this.keydown);
  }
  destroy(){this.key=null;this.picker?.abort();this.root.removeEventListener?.('keydown',this.keydown);}
  commit(key,raw,delay=0){
    const value=C.color(raw),input=this.q('hex_'+key);input.setAttribute('aria-invalid',String(!value));
    if(!value){this.error(t.invalidColor);return Promise.resolve(false);}
    return this.save({colorOverrides:{...this.getSettings().colorOverrides,[key]:value}},delay);
  }
  open(key){
    if(this.key===key)return this.close();
    this.picker?.abort();
    if(this.key)this.q('color_'+this.key).setAttribute('aria-expanded','false');
    this.key=key;this.q('color_'+key).setAttribute('aria-expanded','true');
    this.q('colorItem_'+key).after(this.q('colorEditor'));this.q('colorEditor').hidden=false;this.q('colorSaveStatus').hidden=true;this.update();
    this.q('colorEditor').scrollIntoView?.({block:'nearest',behavior:'instant'});
  }
  close(restoreFocus=true){
    const key=this.key;this.picker?.abort();this.key=null;this.q('colorEditor').hidden=true;this.q('colorSaveStatus').hidden=false;
    if(key){this.q('color_'+key).setAttribute('aria-expanded','false');if(restoreFocus)this.q('color_'+key).focus();}
    return this.flush();
  }
  update(){
    if(!this.key)return;
    this.q('colorEditorStatus').textContent=this.q('colorSaveStatus').textContent;this.q('colorEditorStatus').dataset.state=this.q('colorSaveStatus').dataset.state;
    const value=UI.effectiveColors(this.getSettings())[this.key];
    this.q('colorEditorTitle').textContent=t[this.key+'Color'];this.q('colorValue').textContent=value.toUpperCase();
    this.q('colorPreview').style.setProperty('background',value);
    this.q('colorPreview').style.setProperty('color',C.contrast('#000000',value)>C.contrast('#ffffff',value)?'#000000':'#ffffff');
    for(const [i,channel] of ['R','G','B'].entries()){
      const n=parseInt(value.slice(1+i*2,3+i*2),16),node=this.q('color'+channel);
      if(this.root.activeElement!==node)node.value=String(n);this.q('color'+channel+'Value').textContent=String(n);
    }
  }
  async pick(){
    if(!this.key||typeof globalThis.EyeDropper!=='function'||this.picker)return;
    const key=this.key,controller=new AbortController();this.picker=controller;this.q('colorEyeDropper').disabled=true;
    try{const result=await new globalThis.EyeDropper().open({signal:controller.signal});if(!controller.signal.aborted&&this.key===key)await this.commit(key,result.sRGBHex);}
    catch(e){if(e.name!=='AbortError')this.error(t.pickUnavailable);}
    finally{if(this.picker===controller)this.picker=null;this.q('colorEyeDropper').disabled=false;}
  }
}
globalThis.LimitLiveColorEditor=ColorEditor;
})();
