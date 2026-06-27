/*
  js/app.js
  Bootstrap for the RTT e-Workbook web app
  Author: Kevin Kindle <radtherapyapps@gmail.com>
  License: Creative Commons Attribution-NonCommercial 4.0 International
*/
import {startRouter} from './router.js';

function bootstrap(){
  console.log('RTT e-Workbook starting...');
  startRouter();
}

window.addEventListener('DOMContentLoaded', bootstrap);
