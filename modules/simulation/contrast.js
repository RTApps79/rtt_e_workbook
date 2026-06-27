/*
  modules/simulation/contrast.js
  Contrast injection planning stub
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function planContrast(doseMgPerKg){
  // Basic placeholder calculation
  return {doseMgPerKg, totalMg: Math.round(70 * (doseMgPerKg||1.5))};
}
