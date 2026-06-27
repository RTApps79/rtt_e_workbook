/*
  modules/education/competency.js
  Competency tracking stubs
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function recordCompetency(userId, competencyId, result){
  return {userId, competencyId, result, recordedAt:Date.now()};
}
