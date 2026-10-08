(function () {
  "use strict";
  const base = new URL(".", document.currentScript.src);
  window.AltiminPaths = { url: name => new URL(name, base).href };
  window.escapeHtml = value => String(value ?? "").replace(/[&<>"']/g,
    char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
  window.altiminAccessError = message => {
    document.documentElement.classList.remove("auth-pending");
    const privacyNodes = [...document.querySelectorAll(".privacy-control, .cookie-banner, dialog")];
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
    privacyNodes.forEach(node=>panel.append(node));
  };
})();


// Shared feedback and keyboard handling for the existing drawers.
document.addEventListener('DOMContentLoaded', () => {
  const notice=document.createElement('p');notice.className='altimin-notice';notice.setAttribute('role','status');
  window.altiminNotice = message => {
    const host=document.querySelector('.admin-drawer.open form, .request-drawer.open form, .admin-main, .portal-main, .login-panel-inner') || document.body;
    host.prepend(notice);notice.textContent=message;notice.scrollIntoView({block:'nearest'});
  };
  const drawer=document.querySelector('.admin-drawer, .request-drawer');
  if(drawer) {
    drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-labelledby',drawer.id==='adminDrawer'?'drawerTitle':'requestDrawerTitle');drawer.inert=true;
    let previous=null,wasOpen=false,background=[];
    new MutationObserver(()=>{
      const open=drawer.classList.contains('open');if(open===wasOpen)return;wasOpen=open;drawer.inert=!open;
      if(open) {
        previous=document.activeElement;
        background=[...document.body.children].filter(x=>x!==drawer && x.tagName!=='SCRIPT' && x.tagName!=='DIALOG' && x.id!=='drawerBackdrop').map(x=>[x,x.inert]);
        background.forEach(([x])=>x.inert=true);document.body.style.overflow='hidden';
        drawer.querySelector('.drawer-close')?.focus();
        notice.textContent='';
      } else {
        background.forEach(([x,state])=>x.inert=state);document.body.style.overflow='';previous?.focus();
      }
    }).observe(drawer,{attributes:true,attributeFilter:['class']});
    drawer.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();drawer.querySelector('.drawer-close')?.click();}
      if(event.key!=='Tab')return;
      const items=[...drawer.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(x=>x.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    });
  }
  // Native constraints plus trimmed required fields; suppress repeat submits while saving.
  document.addEventListener('submit',event=>{
    const form=event.target;if(!form.matches('#drawerForm,#requestForm'))return;
    if(form.querySelector('button[type="submit"]:disabled')){event.preventDefault();event.stopImmediatePropagation();return;}
    for(const input of form.querySelectorAll('input[required],textarea[required]')) {
      input.setCustomValidity(input.value.trim()?'':'Please complete this field.');
      input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});
    }
    if(!form.reportValidity()){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.querySelectorAll('.table-shell,.request-table-wrap').forEach(x=>{x.tabIndex=0;x.setAttribute('role','region');x.setAttribute('aria-label','Scrollable records table');});
});

document.addEventListener('click', event => {
  const button=event.target.closest('.service-details-button');if(!button)return;
  const card=button.closest('.service-card');
  const dialog=document.createElement('dialog');dialog.className='privacy-dialog';dialog.setAttribute('aria-labelledby','serviceDetailsTitle');
  const heading=document.createElement('h2');heading.id='serviceDetailsTitle';heading.textContent=card.querySelector('h3')?.textContent.trim() || 'Service details';
  const description=document.createElement('p');description.textContent=card.querySelector('p')?.textContent.trim() || 'Contact Altimin for more information.';
  const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
  dialog.append(heading,description,close);document.body.append(dialog);dialog.showModal();dialog.addEventListener('close',()=>dialog.remove(),{once:true});
});

// Recheck authentication after browser-history restoration; hide stale account markup.
window.addEventListener('pagehide',()=>{
  if(window.PortalStore) { window.PortalStore.reset(); document.documentElement.classList.add('auth-pending'); }
});
window.addEventListener('pageshow',event=>{if(event.persisted && window.PortalStore)location.reload();});
document.addEventListener('DOMContentLoaded',()=>{
 const sidebar=document.querySelector('.admin-sidebar,.portal-sidebar'),toggle=document.getElementById('mobileMenuButton');
 if(!sidebar||!toggle)return;
 const narrow=matchMedia('(max-width:820px)');
 const sync=()=>{const open=sidebar.classList.contains('mobile-open');sidebar.inert=narrow.matches&&!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-controls',sidebar.id);};
 new MutationObserver(sync).observe(sidebar,{attributes:true,attributeFilter:['class']});narrow.addEventListener('change',sync);sync();
 sidebar.addEventListener('click',event=>{if(narrow.matches && event.target.closest('a,button') && !event.target.closest('.privacy-control')){sidebar.classList.remove('mobile-open');toggle.focus();}});
});
