/*
  js/router.js
  Very small hash-based router for demo/navigation
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function startRouter(){
  function showView(name){
    document.querySelectorAll('.view').forEach(v=>v.hidden=true);
    const el=document.getElementById(name);
    if(el) el.hidden=false;
  }

  function onHash(){
    const path=location.hash.replace('#/','') || 'console';
    showView(path);
  }

  window.addEventListener('hashchange', onHash);
  onHash();
}
