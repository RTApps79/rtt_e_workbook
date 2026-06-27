/*
  modules/physics/machineQA.js
  Machine QA helpers (stubs)
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function runMachineQA(tests=[]){
  return tests.map(t=>({test:t, passed:true}));
}
