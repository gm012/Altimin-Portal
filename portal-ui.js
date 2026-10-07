(function () {
  "use strict";
  const base = new URL(".", document.currentScript.src);
  window.AltiminPaths = { url: name => new URL(name, base).href };
  window.escapeHtml = value => String(value ?? "").replace(/[&<>"']/g,
    char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
  window.altiminAccessError = message => {
    document.documentElement.classList.remove("auth-pending");
    document.body.replaceChildren();
    const panel = document.createElement("main");
    panel.style.cssText = "max-width:580px;margin:12vh auto;padding:28px;font:16px/1.6 Arial";
    const title = document.createElement("h1"); title.textContent = "Altimin Portal";
    const text = document.createElement("p"); text.textContent = message;
    const retry = document.createElement("button"); retry.textContent = "Try again";
    retry.onclick = () => location.reload();
    const logout = document.createElement("button"); logout.textContent = "Sign out";
    logout.style.marginLeft = "16px";
    logout.onclick = async () => {
      try { await window.AltiminSession.signOut(); }
      catch { text.textContent = "Sign-out failed. Check your connection and try again."; }
    };
    panel.append(title,text,retry,logout); document.body.append(panel);
  };
})();

