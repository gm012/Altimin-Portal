// Clerk owns delivery, verification and password rules; credentials stay in this form only.
(() => {
 const trigger=document.getElementById('forgotPassword');
 const dialog=document.createElement('dialog');dialog.className='privacy-dialog';dialog.setAttribute('aria-labelledby','resetTitle');document.body.append(dialog);
 let pending=false,attempt=null,step='email';
 const errorText=e=>e?.errors?.[0]?.longMessage || 'Password recovery could not be completed. Check your connection and try again.';
 function render() {
  dialog.innerHTML=`<h2 id="resetTitle">Reset your password</h2><form id="resetForm"><div class="form-field"><label for="resetEmail">Email address</label><input id="resetEmail" type="email" autocomplete="email" required></div><div id="resetFields" hidden><div class="form-field"><label for="resetCode">Verification code</label><input id="resetCode" autocomplete="one-time-code" inputmode="numeric"></div><div class="form-field"><label for="resetPassword">New password</label><input id="resetPassword" type="password" autocomplete="new-password"></div></div><p id="resetStatus" role="status">Enter the email used for your portal account.</p><div class="cookie-actions"><button type="submit" id="resetSubmit">Send reset code</button><button type="button" id="resetCancel">Return to sign in</button></div></form>`;
  dialog.querySelector('#resetEmail').value=document.getElementById('email').value;
  dialog.querySelector('#resetCancel').onclick=()=>{if(!pending)dialog.close();};
  dialog.querySelector('form').onsubmit=async e=>{
   e.preventDefault();if(pending)return;
   const status=dialog.querySelector('#resetStatus'),button=dialog.querySelector('#resetSubmit');
   pending=true;button.disabled=true;dialog.querySelector('#resetCancel').disabled=true;
   try {
    if(!window.Clerk?.client?.signIn)throw new Error('unavailable');
    if(step==='email') {
     attempt=await Clerk.client.signIn.create({strategy:'reset_password_email_code',identifier:dialog.querySelector('#resetEmail').value.trim()});
     step='code';dialog.querySelector('#resetEmail').readOnly=true;dialog.querySelector('#resetFields').hidden=false;
     dialog.querySelector('#resetCode').required=true;dialog.querySelector('#resetPassword').required=true;
     status.textContent='Check your email for a reset code. Enter it with your new password.';button.textContent='Update password';dialog.querySelector('#resetCode').focus();
    } else {
     const result=await attempt.attemptFirstFactor({strategy:'reset_password_email_code',code:dialog.querySelector('#resetCode').value.trim(),password:dialog.querySelector('#resetPassword').value});
     dialog.querySelector('#resetPassword').value='';
     if(result.status==='complete') {
      if(result.createdSessionId)await Clerk.signOut({sessionId:result.createdSessionId});
      dialog.close();document.getElementById('password').value='';
      const message=document.getElementById('loginMessage');message.className='login-message visible success';message.textContent='Password updated. Sign in with your new password.';document.getElementById('password').focus();
     } else {
      dialog.close();Clerk.openSignIn({initialValues:{emailAddress:dialog.querySelector('#resetEmail').value},forceRedirectUrl:AltiminPaths.url('index.html'),fallbackRedirectUrl:AltiminPaths.url('index.html')});
     }
    }
   } catch(error) {status.textContent=errorText(error);}
   finally {pending=false;button.disabled=false;dialog.querySelector('#resetCancel').disabled=false;}
  };
 }
 trigger.addEventListener('click',()=>{if(pending)return;step='email';attempt=null;render();dialog.showModal();});
 dialog.addEventListener('cancel',e=>{if(pending)e.preventDefault();});
 dialog.addEventListener('close',()=>{dialog.replaceChildren();attempt=null;});
})();
