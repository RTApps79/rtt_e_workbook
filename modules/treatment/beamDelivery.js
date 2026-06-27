/*
  modules/treatment/beamDelivery.js
  Beam delivery control stubs
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
export function deliverBeam(beamSpec){
  console.log('deliverBeam', beamSpec);
  return {delivered:true, timestamp:Date.now()};
}
