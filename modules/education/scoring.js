/*
  modules/education/scoring.js
  Education scoring utilities
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function scoreSimulation(attempt){
  return {score: Math.round(Math.random()*100), attempt};
}
