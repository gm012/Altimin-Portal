// Local browser checks with explicit Clerk/Supabase doubles: no live data or emails.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Alto Studio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(__dirname,"..");
test("Consent, reset, failure recovery, validation and duplicate-submit checks",async()=>{
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://localhost").pathname.replace(/^\/Altimin-Portal/,"");
  const file=path.resolve(root,"."+ (pathname.endsWith("/")?pathname+"index.html":pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try {res.setHeader("Content-Type",file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".png")?"image/png":"text/html");res.end(fs.readFileSync(file));}
  catch {res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port+"/Altimin-Portal/";
 const browser=await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
 async function pageFor(role,active=true) {
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.route("https://**/*",route=>route.abort());
  await page.addInitScript(({role,active})=>{
   window.__errors=[];window.__writes=[];window.__internal_ClerkUICtor=function(){};
   window.Clerk={
    session:role?{getToken:async()=>"test-only"}:null,
    user:role?{id:"user_test",firstName:"John",lastName:"Smith",primaryEmailAddress:{emailAddress:"john@example.com"}}:null,
    load:async()=>{},signOut:async opts=>{sessionStorage.setItem("signedOutUrl",opts?.redirectUrl||"");window.Clerk.session=null;window.Clerk.user=null;},
    addListener:fn=>{(window.__listeners ||= []).push(fn);},mountSignUp:()=>{},closeSignIn:()=>{},
   };
   const member={id:"member-test",clerk_user_id:"user_test",role,active,client_id:role==="client"?7:null};
   const clients=[{id:7,company:"ABC <img src=x onerror='window.pwned=1'>",contact:"Different Contact",email:"a@example.com",region:"South Africa",status:"Active"},
     {id:8,company:"Other company",contact:"Other Person",email:"b@example.com",region:"South Africa",status:"Active"}];
   const tables={
    portal_members:[member],portal_clients:clients,
    portal_services:[{id:1,name:"Support",code:"IT",category:"IT",description:"Support",status:"Active"}],
    portal_hardware:[{id:1,name:"Laptop",code:"NB",category:"Hardware",description:"Device",status:"Active"}],
    portal_client_services:[{client_id:7,service_id:1},{client_id:8,service_id:1}],
    portal_requests:[{id:1,client_id:7,title:"Support",type:"Service",quantity:1,details:"<img src=x onerror='window.pwned=1'>",status:"Approved",created_at:new Date().toISOString()}],
    portal_invitations:[],
   };
   class Query {
    constructor(table){this.table=table;this.filters=[];}
    select(){return this;}eq(k,v){this.filters.push([k,v]);return this;}order(){return this;}limit(){return this;}
    insert(v){window.__writes.push({table:this.table,payload:v});this.inserted={id:2,...v,created_at:new Date().toISOString()};return this;}
    update(v){this.updated=v;return this;}
    data(){return this.inserted?[this.inserted]:(tables[this.table]||[]).filter(x=>this.filters.every(([k,v])=>x[k]===v));}
    then(resolve,reject){return Promise.resolve({data:this.data(),error:null}).then(resolve,reject);}
    maybeSingle(){return Promise.resolve({data:this.data()[0]||null,error:null});}
    single(){return this.maybeSingle();}
   }
   window.supabase={createClient:()=>({from:t=>new Query(t),rpc:async()=>({data:null,error:null}),
    functions:{invoke:async()=>({data:{success:true,email:"a@example.com"},error:null})}})};
   localStorage.setItem("altiminPortalV2",JSON.stringify({activeClientId:8,clients,requests:[]}));
   sessionStorage.setItem("altiminAdminPreview","8");
  },{role,active});
  return {context,page,errors};
 }

 try {
  const c=await pageFor('client');await c.page.goto(base+'dashboard.html');await c.page.waitForFunction(()=>!document.documentElement.classList.contains('auth-pending'));
  await c.page.getByRole('button',{name:'Reject optional cookies'}).click();
  assert.deepEqual(await c.page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('altiminConsentV1'));return [x.essential,x.preferences,x.analytics,x.marketing,!!Clerk.session];}),[true,false,false,false,true]);
  await c.page.getByRole('button',{name:'Details →'}).click();await c.page.getByRole('dialog').waitFor();await c.page.keyboard.press('Escape');
  await c.page.locator('.dashboard-header-actions [data-open-request="service"]').click();
  await c.page.locator('#requestCategory').selectOption({label:'Support'});
  await c.page.locator('#requestDetails').fill('Need support');
  await c.page.locator('#requestQuantity').fill('0');await c.page.locator('.request-submit').click();assert.equal(await c.page.evaluate(()=>window.__writes.length),0);
  await c.page.locator('#requestQuantity').fill('1');
  await c.page.evaluate(()=>{AltiminPortalApi.createRequest=async()=>{await new Promise(r=>setTimeout(r,100));throw Error('network');};});
  await c.page.locator('.request-submit').click();await c.page.getByText('The request could not be confirmed.',{exact:false}).waitFor();
  assert.equal(await c.page.locator('#requestDetails').inputValue(),'Need support');assert.equal(await c.page.locator('.request-submit').isEnabled(),true);
  await c.page.keyboard.press('Escape');await c.page.evaluate(()=>{Clerk.session=null;Clerk.user=null;window.__listeners.forEach(fn=>fn({session:null,user:null}));});await c.page.waitForURL('**/index.html');await c.context.close();
  const a=await pageFor('admin');await a.page.goto(base+'admin.html');await a.page.waitForFunction(()=>!document.documentElement.classList.contains('auth-pending'));
  await a.page.evaluate(()=>{PortalStore.hydrate({clients:[],services:[],hardware:[],requests:[]});refreshState();renderAll();openSection('clients');});
  await a.page.getByText('No clients match this search.',{exact:false}).waitFor();
  await a.page.evaluate(()=>openDrawer('client'));await a.page.getByLabel('COMPANY NAME',{exact:true}).fill('New Client');await a.page.getByLabel('PRIMARY CONTACT',{exact:true}).fill('Contact');await a.page.getByLabel('EMAIL ADDRESS',{exact:true}).fill('a@example.com');
  await a.page.evaluate(()=>{window.calls=0;AltiminPortalApi.createClient=async()=>{window.calls++;await new Promise(r=>setTimeout(r,300));throw Error('network');};});
  await a.page.locator('.drawer-submit').click();await a.page.evaluate(()=>document.querySelector('#drawerForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await a.page.getByText('The changes could not be fully confirmed.',{exact:false}).waitFor();assert.equal(await a.page.evaluate(()=>window.calls),1);
  await a.context.close();
  const login=await pageFor(null);await login.page.goto(base+'index.html');await login.page.evaluate(()=>{
   Clerk.client={signIn:{create:async payload=>{window.resetPayload=payload;return {attemptFirstFactor:async payload=>{window.verifyPayload=payload;if(payload.code!=='123456')throw {errors:[{longMessage:'Incorrect verification code.'}]};return {status:'complete',createdSessionId:'session_reset'};}};}}};
  });
  await login.page.click('#forgotPassword');await login.page.getByLabel('Email address',{exact:true}).last().fill('test@example.com');await login.page.getByRole('button',{name:'Send reset code'}).click();
  await login.page.getByLabel('Verification code').fill('000000');await login.page.getByLabel('New password').fill('TestOnly-12345!');await login.page.getByRole('button',{name:'Update password'}).click();await login.page.getByText('Incorrect verification code.').waitFor();
  await login.page.getByLabel('Verification code').fill('123456');await login.page.getByRole('button',{name:'Update password'}).click();await login.page.getByText('Password updated. Sign in with your new password.').waitFor();
  assert.equal(await login.page.evaluate(()=>window.resetPayload.strategy),'reset_password_email_code');assert.equal(await login.page.locator('#password').inputValue(),'');
  assert.deepEqual(login.errors,[]);await login.context.close();
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
});
