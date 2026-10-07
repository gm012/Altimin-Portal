const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../_site");
if(!fs.existsSync(root)) throw new Error("Run node scripts/stage.cjs first.");
http.createServer((req,res)=>{
  const pathname=new URL(req.url,"http://localhost").pathname;
  const file=path.resolve(root,"."+ (pathname.endsWith("/")?pathname+"index.html":pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try {res.setHeader("Cache-Control","no-store");
    res.setHeader("Content-Type",file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".png")?"image/png":"text/html");
    res.end(fs.readFileSync(file));
  } catch {res.writeHead(404).end("Not found");}
}).listen(3000,"127.0.0.1",()=>console.log("Open http://localhost:3000"));

