import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import SystemDesigner from './App';
import reportWebVitals from './reportWebVitals';
import {createPVWattsListeners, createUtilityListeners, setupListeners} from './listeners.js';
import {getMonthlyConsumption} from './utilityRates-API.js';

console.log('rendering');
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

//setupListeners();

// //Set up utlity rate API listeners
//createUtilityListeners();

// //Set up pvWatts API listeners
//createPVWattsListeners();

//Handles runPVWattsAPI result, displays calc results from API call in a div below solar and battery sliders
export function showResult(res) {

    let callButton = document.getElementById('solar-api');
    let consumption; 
    let resultModule = document.getElementById('system-results');
    let averageConsumption = getMonthlyConsumption(); //monthly average kww consumption

    //If button has already been pressed have consumption result display table sum value
    if (callButton.innerHTML === "Recalculate") { 
        console.log('already pressed');
        consumption = numberWithCommas(parseFloat(document.getElementById('month-all').children[2].innerHTML));
    } else {
        consumption = numberWithCommas(12 * averageConsumption); ; 
    }
    //showAPIData(res); //Legacy Line that will show pvwatts api result for testing reasons
    callButton.innerHTML = 'Recalculate'; //Change button text to recalculate after API Called at least once
    
    //Set Gen Days Text
    document.getElementById('gen-days').innerHTML = 'Days with Grid/Gen use: ' + res.genDays;
    //Set self reliance text
    document.getElementById('self-reliance').innerHTML = 'Percent Off-Grid: ' + Math.round(100 * (res.solarConsumption/(12 * averageConsumption)), 3) + '%';
    //Set solar production text
    document.getElementById('solar-production').innerHTML = 'Total Solar Production (kwh): ' + numberWithCommas(Math.round(res.pvOutput));
    //Set solar consumption text
    document.getElementById('solar-consumption').innerHTML = 'Estimated Building Consumption (kwh): ' + consumption;
    //Set percent offset text
    document.getElementById('percent-offset').innerHTML = 'Additional Offset from Grid Sellback: ' + Math.round(100 * (res.gridOutflow/(12 * averageConsumption)), 3) + '%'

    //Show result text 
    resultModule.style.display = 'block';
    //Show recalc wrapper for monthly results
    document.getElementById('recalc-wrapper').style.display = 'block';
    //Show monthly results table
    document.getElementById('monthly-results').style.display = 'block';
    //Show email input and submit system data button
    document.getElementById('email-results').style.display = 'block';
    
    return res;
    
}

//Helper to display large numbers with commas
export function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
