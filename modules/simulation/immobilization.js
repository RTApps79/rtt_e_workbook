/*
  modules/simulation/immobilization.js
  Immobilization device stubs
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function createImmobilization(deviceType='vacbag'){
  return {type:deviceType, createdAt:Date.now(), info:'stub'};
}
