/* Consent never gates Clerk or Supabase. No analytics/marketing SDKs are installed. */
(() => {
  const key = 'altiminConsentV1';
  let choice;
  try { const v=JSON.parse(localStorage.getItem(key)); if(v?.version===1 && typeof v.preferences==='boolean') choice=v; } catch {}
  const banner=document.createElement('section'); banner.className='cookie-banner'; banner.setAttribute('aria-label','Cookies and privacy');
  banner.innerHTML='<p>Altimin uses essential cookies and similar technologies to provide secure portal access. Optional technologies are only used with your permission. No analytics or marketing trackers are currently used.</p><div class="cookie-actions"><button data-choice="accept">Accept optional cookies</button><button data-choice="reject">Reject optional cookies</button><button data-preferences>Cookie preferences</button></div>';
  const dialog=document.createElement('dialog'); dialog.className='privacy-dialog'; dialog.setAttribute('aria-labelledby','privacyTitle');
  document.body.append(dialog);
  const main=document.querySelector('.login-panel-inner, .admin-main, .portal-main') || document.body;
  const control=document.createElement('button');
  control.type='button';control.className='privacy-control';control.textContent='Privacy & Cookies';
  control.setAttribute('data-preferences','');control.setAttribute('aria-haspopup','dialog');
  const placement=document.querySelector('.login-footer, .admin-sidebar, .portal-sidebar');
  (placement || main).append(control);
  main.append(banner);banner.hidden=!!choice;
  function save(preferences) {
    choice={version:1,essential:true,preferences,analytics:false,marketing:false,updatedAt:new Date().toISOString()};
    let stored=true; try {localStorage.setItem(key,JSON.stringify(choice));}catch{stored=false;}
    banner.hidden=true;dialog.close();
    if(!stored) window.altiminNotice?.('Your choice applies for this page. Browser storage is unavailable, so you may be asked again.');
  }
  function open(privacy=false) {
    dialog.innerHTML=privacy ? `<h2 id="privacyTitle">Privacy Notice</h2><p>Altimin Limited uses this portal to manage client accounts, assigned services and service or hardware requests.</p><h3>Information used</h3><p>This includes your name, business contact details, company, account permissions, requests and their status history. Clerk handles credentials and authentication; passwords are not stored in the portal database.</p><h3>Providers and access</h3><p>Clerk provides authentication. Supabase stores portal records. Authorised Altimin administrators manage client accounts; client access is restricted to the assigned company. The staging website is hosted on GitHub Pages. These providers may process information outside your country.</p><h3>Cookies and local storage</h3><p>Authentication cookies and similar security technology are necessary for sign-in. This browser stores your privacy choice and may temporarily store an administrator preview selection. Business records are not saved to localStorage. Fonts are loaded from Google Fonts, which receives a connection from your browser. No intentional analytics or marketing trackers are installed.</p><h3>Questions and rights requests</h3><p>Contact your Altimin account representative, or use the contact details on <a href="https://altiminlimited.com" target="_blank" rel="noopener noreferrer">Altimin’s company website</a>, to request access, correction or deletion of your information. Retention and requests are subject to business and legal requirements; Altimin must confirm its retention periods and privacy contact before production.</p><div class="cookie-actions"><button type="button" data-preferences>Cookie preferences</button><button type="button" data-close>Close notice</button></div>` : `<h2 id="privacyTitle">Cookie preferences</h2><p>Essential access technology stays active. Accepting optional cookies currently only records your preference; it does not install trackers or authorise future analytics or marketing.</p><label><input type="checkbox" checked disabled><span><strong>Essential / Authentication — always active</strong><small>Secure login, session protection and saving your privacy choice.</small></span></label><label><input id="optionalPreferences" type="checkbox" ${choice?.preferences?'checked':''}><span><strong>Preferences — optional</strong><small>No optional preference technology is currently used.</small></span></label><label><input type="checkbox" disabled><span><strong>Analytics — off / not used</strong></span></label><label><input type="checkbox" disabled><span><strong>Marketing — off / not used</strong></span></label><div class="cookie-actions"><button type="button" data-save>Save preferences</button><button type="button" data-privacy>Privacy notice</button><button type="button" data-close>Cancel</button></div>`;
    if (!dialog.open) dialog.showModal();
    else dialog.querySelector('button')?.focus();
  }
  document.addEventListener('click',event=>{
    const t=event.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-preferences'))open();
    if(t.hasAttribute('data-privacy'))open(true);
    if(t.dataset.choice)save(t.dataset.choice==='accept');
    if(t.hasAttribute('data-save'))save(dialog.querySelector('#optionalPreferences').checked);
    if(t.hasAttribute('data-close'))dialog.close();
  });
})();
