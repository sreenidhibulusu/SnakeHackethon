const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const executable=process.env.VIKING_CHROMIUM;
if (!executable) { console.error('Set VIKING_CHROMIUM to your Chromium or chrome-headless-shell executable.'); process.exit(2); }
const dir=fs.mkdtempSync('/tmp/viking-browser-');
const browser=spawn(executable,['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-pipe',`--user-data-dir=${dir}`],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let id=0,buffer='',stderr='';const waiting=new Map(),errors=[],remoteRequests=[];
browser.stderr.on('data',v=>{stderr+=v.toString()});
for (const stream of [browser.stdio[3],browser.stdio[4]]) stream.on('error',error=>{stderr += error.message;});
browser.on('error',error=>{console.error(error.message);process.exitCode=1;});
function send(method,params={},sessionId){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{waiting.delete(n);reject(new Error('CDP timeout '+method+' '+stderr.slice(-1200)))},10000);waiting.set(n,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});browser.stdio[3].write(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
browser.stdio[4].on('data',data=>{buffer+=data.toString();let end;while((end=buffer.indexOf('\0'))>=0){const str=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!str)continue;const msg=JSON.parse(str);if(msg.id){const p=waiting.get(msg.id);if(p){waiting.delete(msg.id);msg.error?p.reject(new Error(JSON.stringify(msg.error))):p.resolve(msg.result)}}else handle(msg).catch(e=>errors.push(e.message));}});
async function handle(msg){
 if(msg.method==='Runtime.exceptionThrown') errors.push(JSON.stringify(msg.params.exceptionDetails));
 if(msg.method!=='Fetch.requestPaused')return;
 const {request,requestId}=msg.params;let status=200,body='',type='text/html';
 const url=new URL(request.url);
 if(url.hostname==='viking.test'){
  const name=path.basename(url.pathname)||'index.html';
  try{body=fs.readFileSync(path.join(root,name));type=name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html'}catch{status=404;body='Missing '+name;}
 }else{remoteRequests.push(request);status=429;body='Notification service request limit reached';type='text/plain';}
 await send('Fetch.fulfillRequest',{requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:type},{name:'Access-Control-Allow-Origin',value:'*'}],body:Buffer.from(body).toString('base64')},msg.sessionId);
}
async function evaluate(sessionId,expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function tab(url){const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);await send('Fetch.enable',{patterns:[{urlPattern:'*'}]},sessionId);
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.EventSource=class {static OPEN=1;constructor(){this.readyState=1;queueMicrotask(()=>this.onopen?.())}close(){}};`},sessionId);
 await send('Page.navigate',{url:'http://viking.test/'+url},sessionId);return sessionId;}
async function until(sessionId,expr){for(let i=0;i<60;i++){if(await evaluate(sessionId,expr))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Not reached: '+expr+' Errors: '+errors.join('\n'));}
(async()=>{
 await send('Browser.getVersion');
 const start=await tab('index.html?pair=1');
 const weapon=await tab('weapons.html?pair=1');
 const season=await tab('seasons.html?pair=1');
 const result=await tab('result.html?pair=1');
 for(const display of [start,weapon,season,result])await until(display,`!!window.vikingApp && document.getElementById('scan-connection').textContent.startsWith('Ready')`);
 async function scan(station,token){const phone=await tab('scan.html?station='+station+'&pair=1&token='+token);await until(phone,`document.getElementById('scan-status')?.textContent.includes('Scan received')`);return phone;}
 await scan('start','browser-A');
 await until(start,`!document.querySelector('.builder').hidden`);
 await evaluate(start,`document.getElementById('viking-name').value='Astrid';document.getElementById('viking-name').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-choice="woman"]').click();document.getElementById('done').click();`);
 await until(start,`document.querySelector('.builder').hidden`);
 await scan('seasons','browser-A');
 await until(season,`document.getElementById('preview-name').getAttribute('aria-label')==='Astrid'`);
 await evaluate(season,`document.querySelector('[data-choice="winter"]').click()`);
 await scan('weapons','browser-A');
 await until(weapon,`document.getElementById('preview-name').getAttribute('aria-label')==='Astrid'`);
 await evaluate(weapon,`document.querySelector('[data-choice="spear"]').click()`);
 await scan('result','browser-A');
 await until(result,`document.getElementById('result-summary').textContent==='Woman · Spear · Winter'`);
 assert.equal(await evaluate(result,`document.getElementById('preview-name').getAttribute('aria-label')`),'Astrid');
 assert.equal(remoteRequests.length,0,'Local scans must not need the remote notification service');
 await scan('start','browser-A');
 await until(start,`document.getElementById('weapon-art').innerHTML.includes('m354 461')`);
 await evaluate(start,`document.getElementById('viking-name').value='Ragnar';document.getElementById('viking-name').dispatchEvent(new Event('input',{bubbles:true}));`);
 for(const display of [weapon,season,result])await until(display,`document.getElementById('preview-name').getAttribute('aria-label')==='Ragnar'`);
 await scan('start','browser-B');
 await until(start,`window.vikingApp.token==='browser-B'`);
 assert.equal(await evaluate(start,`document.getElementById('weapon-art').innerHTML`),'');
 await scan('start','browser-A');
 await until(start,`document.getElementById('viking-name').value==='Ragnar'`);
 await evaluate(start,`document.getElementById('reset-viking').click()`);
 await until(result,`document.getElementById('result-summary').textContent==='Man · No weapon · Ragged clothing'`);
 // No matching local pair: exercise the remote HTTP failure path.
 const rejected=await tab('scan.html?station=start&pair=3&token=browser-A');
 await until(rejected,`document.getElementById('scan-status')?.textContent.includes('HTTP 429')`);
 assert.equal(await evaluate(rejected,`document.getElementById('retry').hidden`),false);
 assert.deepEqual(errors,[]);
 console.log('REAL CHROMIUM PASS: actual HTML startup, cross-tab scans acknowledged without internet, name saved and synced across all stations, equipment, Done, token switching, reset, and remote HTTP 429 error/retry.');
})().then(()=>browser.kill()).catch(error=>{console.error(error);console.error(stderr.slice(-1000));browser.kill();process.exitCode=1;}).finally(()=>{setTimeout(()=>fs.rmSync(dir,{recursive:true,force:true}),200);});
