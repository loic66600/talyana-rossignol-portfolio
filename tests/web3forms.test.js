import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const contactEndpoint ='), source.indexOf("  $('.copy-request').addEventListener"));
function setup(fetchImpl, overrides = {}) {
  let submit, resets = 0;
  const values = {name:'Camille Martin',company:'Studio Exemple',email:'camille@example.com',message:'Bonjour, demande pour un shooting.',access_key:'test-public-key',...overrides};
  const form = {addEventListener:(_,cb)=>{submit=cb;},reportValidity:()=>true,setAttribute(){},removeAttribute(){},reset(){resets++;}};
  const elements = {'#contact-form':form,'#form-status':{textContent:'',focus(){}},'.submit-button':{innerHTML:'Envoyer',disabled:false},'#contact-mailto':{hidden:true},'.copy-request':{hidden:true}};
  vm.runInNewContext(`let requestText='';${handler}`,{$:s=>elements[s],FormData:class{get(k){return values[k]??null;}},fetch:fetchImpl,AbortSignal,encodeURIComponent});
  return {send:()=>submit({preventDefault(){},currentTarget:form}),elements,resets:()=>resets};
}
test('Web3Forms receives the client fields, subject and public key, and only confirmed success resets the form',async()=>{
 let request; const ctx=setup(async(url,options)=>{request={url,...JSON.parse(options.body)};return {ok:true,json:async()=>({success:true})};});
 await ctx.send();
 assert.equal(request.url,'https://api.web3forms.com/submit');
 assert.equal(request.access_key,'test-public-key');
 assert.equal(request.subject,'Demande de Camille Martin — Studio Exemple');
 assert.equal(request.email,'camille@example.com');
 assert.equal(request.from_name,'Portfolio Talyana Rossignol');
 assert.equal(request.botcheck,false);
 assert.equal(ctx.resets(),1);assert.match(ctx.elements['#form-status'].textContent,/envoyée/);assert.equal(ctx.elements['.submit-button'].disabled,false);
});
for(const [label,response] of [['rejected',{ok:true,json:async()=>({success:false})}],['rate limited',{ok:false,status:429,json:async()=>({success:false})}],['invalid JSON',{ok:true,json:async()=>{throw new Error('bad JSON');}}]]) {
 test(`${label}: keep the message and expose the Talyana fallback`,async()=>{
  const ctx=setup(async()=>response);await ctx.send();assert.equal(ctx.resets(),0);assert.equal(ctx.elements['#contact-mailto'].hidden,false);assert.match(ctx.elements['#contact-mailto'].href,/^mailto:rossignoltalyana12@gmail.com/);assert.equal(ctx.elements['.submit-button'].disabled,false);
 });
}
test('network failure keeps message',async()=>{const ctx=setup(async()=>{throw new TypeError('network');});await ctx.send();assert.equal(ctx.resets(),0);assert.match(ctx.elements['#form-status'].textContent,/conservé/);});
test('honeypot prevents submission',async()=>{let calls=0;const ctx=setup(async()=>{calls++;},{botcheck:'on'});await ctx.send();assert.equal(calls,0);});
test('double submission is ignored while waiting for the provider',async()=>{
 let finish,calls=0;const ctx=setup(()=>{calls++;return new Promise(resolve=>finish=resolve);});const pending=ctx.send();await ctx.send();assert.equal(calls,1);finish({ok:true,json:async()=>({success:true})});await pending;
});
test('HTML supports native POST and contains the configured Web3Forms key',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/<form action="https:\/\/api.web3forms.com\/submit" method="POST" id="contact-form"/);assert.match(html,/name="access_key" value="303012e6-d2b3-4f93-a485-bf7132681bf8"/);assert.match(html,/name="botcheck"/);assert.doesNotMatch(source,/prepareContact|talyana-rossignol-portfolio\.vercel\.app\/api\/contact/);
});
