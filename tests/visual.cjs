// Local browser checks with explicit Clerk/Supabase doubles: no live data or emails.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/Alto Studio/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const root=path.resolve(__dirname,"..");
test("Visual viewport evidence and layout assertions",async()=>{
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
  await page.route("https://**/*",route=>/fonts\.(googleapis|gstatic)\.com/.test(route.request().url())?route.continue():route.abort());
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
  const out=path.join(root,'audit-evidence');fs.mkdirSync(out,{recursive:true});
  const sizes=[{width:1920,height:1080},{width:1366,height:768},{width:768,height:1024},{width:390,height:844}];
  for(const size of sizes) {
   for(const [file,role] of [['index.html',null],['accept-invitation.html',null],['admin.html','admin'],['dashboard.html','client']]) {
    const v=await pageFor(role);await v.page.setViewportSize(size);await v.page.goto(base+file);await v.page.evaluate(()=>document.fonts.ready);
    await v.page.waitForFunction(()=>!document.documentElement.classList.contains('auth-pending'));
    await v.page.screenshot({path:path.join(out,file+'-'+size.width+'.png'),fullPage:true});
    assert.equal(await v.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,file+' overflow '+size.width);
    if(file==='index.html') {
     const gap=await v.page.evaluate(()=>document.querySelector('.login-footer').getBoundingClientRect().top-document.querySelector('.secure-access').getBoundingClientRect().bottom);
     assert.ok(gap>=30,'footer gap '+gap);
     await v.page.getByRole('button',{name:'Cookie preferences',exact:true}).first().click();
     await v.page.screenshot({path:path.join(out,'preferences-'+size.width+'.png'),fullPage:true});
     await v.page.getByRole('button',{name:'Save preferences'}).click();
     assert.equal(await v.page.evaluate(()=>JSON.parse(localStorage.getItem('altiminConsentV1')).essential),true);
     await v.page.reload();assert.equal(await v.page.locator('.cookie-banner').isVisible(),false);
     await v.page.click('#forgotPassword');await v.page.screenshot({path:path.join(out,'password-reset-'+size.width+'.png'),fullPage:false});
    }
    if(file==='admin.html') {
     await v.page.evaluate(()=>openClientManager(7));await v.page.waitForTimeout(500);
     await v.page.screenshot({path:path.join(out,'client-drawer-'+size.width+'.png'),fullPage:false});
     assert.ok(await v.page.locator('.client-management-summary-copy').evaluate(x=>x.getBoundingClientRect().width)>240,'description width');
     assert.equal(await v.page.locator('#fieldCompany').evaluate(x=>getComputedStyle(x).color),'rgb(23, 43, 77)');
     assert.equal(await v.page.locator('#fieldCompany').evaluate(x=>x.labels.length),1);
     await v.page.keyboard.press('Escape');
     await v.page.evaluate(()=>openDrawer('service'));await v.page.waitForTimeout(500);
     await v.page.screenshot({path:path.join(out,'service-drawer-'+size.width+'.png'),fullPage:false});
    }
    if(file==='dashboard.html') {
     await v.page.locator('.dashboard-header-actions [data-open-request="hardware"]').click();await v.page.waitForTimeout(500);
     await v.page.screenshot({path:path.join(out,'request-drawer-'+size.width+'.png'),fullPage:false});
    }
    assert.deepEqual(v.errors,[],file);await v.context.close();
   }
  }
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
});
