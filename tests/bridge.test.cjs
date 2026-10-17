const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
test('page bridge preserves the fetch promise and streaming response, exports no credentials or body',async()=>{
 const messages=[];const response=new Response('private response');const promise=Promise.resolve(response);const listeners={};
 const c=vm.createContext({URL,Request,Headers,location:{href:'https://chatgpt.com/',origin:'https://chatgpt.com'},Date,fetch:()=>promise,postMessage:d=>messages.push(d),addEventListener:(n,f)=>listeners[n]=f});c.window=c;
 vm.runInContext(fs.readFileSync(__dirname+'/../extension/bridge.js','utf8'),c);
 const result=c.fetch('/backend-api/conversation',{method:'POST',headers:{authorization:'Bearer SECRET','chatgpt-account-id':'workspace-a'},body:'private prompt'});
 assert.equal(result,promise);assert.equal(await (await result).text(),'private response');await new Promise(r=>setImmediate(r));
 assert.ok(messages.some(m=>m.type==='context'&&m.value==='workspace-a'));assert.ok(messages.some(m=>m.type==='activity'));assert.doesNotMatch(JSON.stringify(messages),/SECRET|private prompt|private response/);
});
test('page bridge ignores unrelated origins',async()=>{const messages=[];const c=vm.createContext({URL,Request,Headers,location:{href:'https://chatgpt.com/',origin:'https://chatgpt.com'},Date,fetch:()=>Promise.resolve(new Response('ok')),postMessage:d=>messages.push(d),addEventListener(){}});c.window=c;vm.runInContext(fs.readFileSync(__dirname+'/../extension/bridge.js','utf8'),c);await c.fetch('https://example.com/backend-api/conversation',{method:'POST',headers:{'chatgpt-account-id':'other'}});assert.equal(messages.length,0)});
