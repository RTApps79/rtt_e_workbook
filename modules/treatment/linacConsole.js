/*
  modules/treatment/linacConsole.js
  Linac console UI / control stubs
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function startLinacSession(settings={}){
  console.log('Linac session start', settings);
  return {sessionId:Date.now(), status:'started'};
}
