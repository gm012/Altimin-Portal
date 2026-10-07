// Publish only the browser application, never SQL, functions, tests or repository metadata.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "_site");
if (fs.existsSync(out)) throw new Error("_site already exists. Rename that generated folder before staging again.");
fs.mkdirSync(out);
const files = ["index.html","admin.html","dashboard.html","accept-invitation.html",
  "admin.css","portal.css","login.css","login.js","admin.js","dashboard.js",
  "portal-config.js","portal-session.js","portal-api.js","portal-store.js","portal-ui.js","accept-invitation.js"];
for (const file of files) fs.copyFileSync(path.join(root,file),path.join(out,file));
fs.cpSync(path.join(root,"images"),path.join(out,"images"),{recursive:true});
fs.writeFileSync(path.join(out,".nojekyll"),"");
console.log("Browser-only staging artifact: "+out);

