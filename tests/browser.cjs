// Local browser checks with explicit Clerk/Supabase doubles: no live data or emails.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Alto Studio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(__dirname,"..");
test("Role routing, client isolation, preview, XSS and project-path sign-out",async()=>{
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
    addListener:()=>{},mountSignUp:()=>{},closeSignIn:()=>{},
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
  const c=await pageFor("client");
  await c.page.goto(base+"dashboard.html?client=8");
  await c.page.waitForFunction(()=>!document.documentElement.classList.contains("auth-pending"));
  assert.equal(await c.page.evaluate(()=>PortalStore.load().activeClientId),7);
  assert.equal(await c.page.evaluate(()=>PortalStore.load().clients.length),1);
  assert.equal(await c.page.locator(".sidebar-account strong").textContent(),"John Smith");
  assert.equal(await c.page.evaluate(()=>window.pwned),undefined);
  assert.equal(await c.page.evaluate(()=>localStorage.getItem("altiminPortalV2")),null);
  assert.equal(await c.page.getByText("ADMIN PREVIEW",{exact:true}).count(),0);
  await c.page.evaluate(()=>AltiminPortalApi.createRequest({clientId:8,title:"Test",type:"Service",quantity:1,details:"Test"}));
  assert.equal(await c.page.evaluate(()=>window.__writes.at(-1).payload.client_id),7);
  await c.page.goto(base+"admin.html");await c.page.waitForURL("**/dashboard.html");
  assert.deepEqual(c.errors,[]);
  await c.page.setViewportSize({width:390,height:844});
  await c.page.waitForFunction(()=>!document.documentElement.classList.contains("auth-pending"));
  assert.equal(await c.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await c.page.click("#mobileMenuButton");
  await c.page.click("#signOutButton");await c.page.waitForURL("**/Altimin-Portal/index.html");
  assert.equal(await c.page.evaluate(()=>sessionStorage.getItem("signedOutUrl")),base+"index.html");
  await c.context.close();

  const a=await pageFor("admin");await a.page.goto(base+"dashboard.html?client=8");
  await a.page.getByText("ADMIN PREVIEW",{exact:true}).waitFor();
  assert.equal(await a.page.evaluate(()=>PortalStore.load().activeClientId),8);
  await a.page.goto(base+"admin.html");
  await a.page.waitForFunction(()=>!document.documentElement.classList.contains("auth-pending"));
  await a.page.locator('[data-section="clients"]').click();
  await a.page.locator('[data-client-id="7"]').click();
  await a.page.locator("#sendPortalInviteButton").waitFor();
  assert.equal(await a.page.locator("#fieldCompany").inputValue(),"ABC <img src=x onerror='window.pwned=1'>");
  assert.equal(await a.page.evaluate(()=>window.pwned),undefined);
  assert.deepEqual(a.errors,[]);
  await a.context.close();

  const inactive=await pageFor("client",false);
  await inactive.page.goto(base+"dashboard.html");await inactive.page.waitForURL("**/accept-invitation.html");
  await inactive.page.getByText("Your portal access is inactive.",{exact:false}).waitFor();
  await inactive.context.close();
  const anon=await pageFor(null);
  await anon.page.goto(base+"admin.html");await anon.page.waitForURL("**/index.html");
  assert.deepEqual(anon.errors,[]);
  await anon.context.close();
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
});
