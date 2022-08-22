import {runUtilityAPI} from './utilityRates-API.js';
import {runGeoAPI} from './googleMaps-API.js';
import {runPVWattsAPI, updateTableSubArrays, updateAnnualData, updateMonthlyTable} from './pvWatts-API.js';
// import {updateAnnualData} from './pvWatts-API.js';
// import {updateTableSubArrays} from './pvWatts-API.js';
import { showResult } from './index.js';
import {sendZohoWebhook} from "./zohoSheets-API.js";

let invQuant = document.getElementById("inverter-quantity");
let invOpt = document.getElementById('inverter-options');
let batteryQuant = document.getElementById("battery-quantity");
let batteryOptions = document.getElementById('battery-options');
let batterySlider = document.getElementById('battery-array-slider');
let solarSlider = document.getElementById('solar-array-slider');


export function setupListeners() {
    //Set up references to html elements to add event listeners  
    let invQuant = document.getElementById("inverter-quantity");
    let invOpt = document.getElementById('inverter-options');
    let batteryQuant = document.getElementById("battery-quantity");
    let batteryOptions = document.getElementById('battery-options');
    let batterySlider = document.getElementById('battery-array-slider');
    let solarSlider = document.getElementById('solar-array-slider');

    //On hover have total consumptionIcon show popup
    let consumptionIcon = document.getElementById('consumption-icon');
    console.log(consumptionIcon);
    consumptionIcon.addEventListener('mouseover', function() {
        document.getElementById("consumption-popup").classList.toggle("show");
        let popContainer = document.getElementById("consumption-popup-wrapper");
        let coords = getCoords(consumptionIcon);
        popContainer.style.left = (coords.left + 5 - getCoords(document.getElementById('monthly-results')).left).toString() + 'px';
        //popContainer.style.top = coords.top;
    });

    //Hide popup on mouse leave
    consumptionIcon.addEventListener('mouseout', function() {
        document.getElementById("consumption-popup").classList.toggle("show");
    });

    //Function retrievs top and left coords of an element relative to whole page
    function getCoords(elem) { // crossbrowser version
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    }

    //Add event listener to bound inverter quantity and update solar array slider default val
    invQuant.addEventListener('change', function () {
        updateSolarSlider();
        batterySlider.setAttribute('max', 3*invQuant.value);
        batteryQuant.max = 3 * invQuant.value;
    });

    //Add event listener that updates inverter quantity and solar array slider and text when inverter dropwdown option changes
    invOpt.addEventListener('change', function () {
        if (invOpt.value == '125') {
            batteryOptions.value = "eSpire";
            batteryQuant.value = 1;
            batterySlider.setAttribute('max', 3*invQuant.value);
            batteryQuant.max = 3 * invQuant.value;
        }
        updateSolarSlider();
    });

    //Add event listener to bound battery quantity
    batteryQuant.addEventListener('change', function () {
        if (batteryQuant.value < 0) { batteryQuant.value = 0;}
        //Bound upper end based on battery type:
        let upperBound;
        if (batteryOptions.value == 'eFlex') {
            upperBound = 16;
        } else if (batteryOptions.value == 'eVault Max') {
            upperBound = 20;
        } else if (batteryOptions.value == 'eSpire') { 
            upperBound = batteryQuant.max;
        }
        if (batteryQuant.value > upperBound) {
            batteryQuant.value = upperBound;
        }
    })

    //Set up event listener for slider that updates text for solar array
    solarSlider.addEventListener("input", function () {
        let kWVal = Math.round(parseInt(solarSlider.value) * 0.43, 1);
        document.getElementById("solar-array-panels").innerHTML = solarSlider.value + " panels, " + kWVal.toString() + " kW";
        //document.getElementById("solar-array-kws").innerHTML = kWVal.toString() + " kW";
        updateBatterySystemText(kWVal);
    });

    let lastBatteryVal = 1;
    //Set up event listener for eflex vs evault max drpdown to update battery type and count
    batteryOptions.addEventListener('change', function () {
        let kWVal = Math.round(parseInt(solarSlider.value) * 0.43, 1);
        let currentOption = document.querySelector("option[value='" + batteryOptions.value + "']");
        let battVal = Math.ceil(batteryQuant.value * lastBatteryVal / currentOption.getAttribute('power'));
        let battMax = currentOption.getAttribute('max');
        lastBatteryVal = currentOption.getAttribute('power');
        battVal > battMax ? batteryQuant.value = battMax : batteryQuant.value = battVal;
        batterySlider.max = battMax;
        updateBatterySystemText(kWVal);
    });

    //Set up event listener for battery quantity to update text
    document.getElementById("battery-quantity").addEventListener('change', function () {
        let kWVal = Math.round(parseInt(solarSlider.value) * 0.43);
        updateBatterySystemText(kWVal);
    });

    //Set up event listener to update text when slider gets updated
    document.getElementById('battery-array-slider').addEventListener('input', function () {
        let currentOption = document.querySelector("option[value='" + batteryOptions.value + "']");
        document.getElementById('battery-array-panels').innerHTML = batterySlider.value.toString() + " " +  batteryOptions.value + "s, " +
        Math.round(batterySlider.value * parseFloat(currentOption.getAttribute('power')), 1).toString() + " kWh";
        //document.getElementById('battery-array-kwhs').innerHTML = Math.round(batterySlider.value * parseFloat(currentOption.getAttribute('power')), 1).toString() + " kWh";
        batteryQuant.value = batterySlider.value;
    })

}

export function handleBatterySlider() {
    console.log(document.getElementById('battery-array-slider').value);
    
        let currentOption = document.querySelector("option[value='" + document.getElementById('battery-options').value + "']");
        console.log(parseFloat(currentOption.getAttribute('power')));
        document.getElementById('battery-array-panels').innerHTML = document.getElementById('battery-array-slider').value.toString() + " " +  document.getElementById('battery-options').value + "s, " +
        Math.round(batterySlider.value * parseFloat(currentOption.getAttribute('power')), 1).toString() + " kWh";
        //document.getElementById('battery-array-kwhs').innerHTML = Math.round(batterySlider.value * parseFloat(currentOption.getAttribute('power')), 1).toString() + " kWh";
        batteryQuant.value = document.getElementById('battery-array-slider').value;
}

//Function determines minimum amount of batteries and updates battery text next to battery slider
export function updateBatterySystemText(kWVal) {
    //Set up references to html elements to add event listeners  
    //Set up references to html elements to add event listeners  
    let invQuant = document.getElementById("inverter-quantity");
    let batteryQuant = document.getElementById("battery-quantity");
    let batteryOptions = document.getElementById('battery-options');
    let batterySlider = document.getElementById('battery-array-slider');


    let quantity;
    let minimumBatts; //Counts the minimum number of batteries needed given solar array size
    //Update kwh text
    if (batteryOptions.value === 'eFlex') {
        minimumBatts = Math.ceil(kWVal/5);
        if (minimumBatts > 16) {quantity = 16;} else { quantity = Math.max(batteryQuant.value, minimumBatts) } //set bound on battery number for eFlex
        //document.getElementById('battery-array-kwhs').innerHTML = Math.round(parseInt(batteryString) * 5.4 , 1).toString() + " kWh";
    } else if (batteryOptions.value === 'eVault Max') {
        minimumBatts = Math.ceil(kWVal/12);
        if (minimumBatts > 20) { quantity = 20;} else { quantity = Math.max(batteryQuant.value, minimumBatts) } //set bound on battery number for eVault Max
        //document.getElementById('battery-array-kwhs').innerHTML = Math.round(parseInt(batteryString) * 18.5, 1).toString() + " kWh";
    } else if (batteryOptions.value === 'eSpire') {
        minimumBatts = Math.ceil(kWVal/125);
        if (minimumBatts > 3*invQuant.value) { quantity = 3*invQuant.value; } else { quantity = Math.max(batteryQuant.value, minimumBatts) } //set bound on battery number for eSpire      
    }
    let currentOption = document.querySelector("option[value='" + batteryOptions.value + "']");
    console.log(quantity);
    //document.getElementById('battery-array-kwhs').innerHTML = Math.round(quantity * parseFloat(currentOption.getAttribute('power'))).toString() + " kWh";
    document.getElementById('battery-array-panels').innerHTML = quantity.toString() + " " +  batteryOptions.value + "s, " +
    Math.round(quantity * parseFloat(currentOption.getAttribute('power'), 1)).toString() + " kWh";
    
    return quantity;
    // //Update Battery Quantity
    // batteryQuant.value = quantity;
    // //Update Battery Slider
    // batterySlider.value = quantity;
}

//Updates solar slider for inverter listeners
export function updateSolarSlider() {
    //Set up references to html elements to add event listeners  
    let invQuant = document.getElementById("inverter-quantity");
    let invOpt = document.getElementById('inverter-options');
    let solarSlider = document.getElementById('solar-array-slider');
    let batteryOptions = document.getElementById('battery-options');
    //Make sure dropwdown has a value
    if (invOpt.value.length == 0) { 
        return;
    }

    if (invQuant.value < 0) { invQuant.value = 0;} //Bound negative input

    //Bound inv quantity depending on inverter type
    //7.6kW and 12kW inverter maximum 12 units
    //125kW inverter maximum 3 espires per inverter    
    if (invOpt.value == '7.6' || invOpt.value == '12') {
        if (invQuant.value > 12) {
            invQuant.value = 12;
        }
    } else if (invOpt.value == '125') { 
        if (invQuant.value > 5) {
            invQuant.value = 5;
        }
    } 

    //Compute solar kW value based one inverter size and quantity
    let kWVal = Math.round(parseFloat(invOpt.value) * parseFloat(invQuant.value) * 10) /10;
    //Make sure solar array can be no bigger than 130% inverter size
    solarSlider.max = 1.3 * Math.ceil(kWVal / 0.43);
    if (invOpt.value == '12') {
        solarSlider.max = Math.ceil(parseFloat(invQuant.value) * 18/0.43); //12kw inverter should be capped at 18kw
    }

    return Math.ceil(kWVal / 0.43);
    //Calculate number of panels based on 0.43 kw sized ones
    //solarSlider.value =  Math.ceil(kWVal / 0.43);
    // //Update text next to solar slider
    // document.getElementById("solar-array-panels").innerHTML = solarSlider.value + " panels, " + kWVal.toString() + " kW";
    // //Update battery values as well if battery dropdown filled out
    // if (batteryOptions.value.length != 0) {
    //     updateBatterySystemText(kWVal);
    //}
}

export function createUtilityListeners() {
    const buttonVal = document.getElementById("utility-api");
    const zipCodeInp = document.getElementById('zip-code');
    const billInp = document.getElementById('monthly-bill');

    buttonVal.addEventListener("click", function() {
        if (zipCodeInp.value.length != 0 && billInp.value.length != 0) {
            runUtilityAPI();
        }
    });
    
    //Get updating zip code input or bill to recall utility api
    zipCodeInp.addEventListener("change", function() {
        if (zipCodeInp.value.length != 0 && billInp.value.length != 0) {
            runUtilityAPI();
        }
    });
    billInp.addEventListener("change", function() {
        if (zipCodeInp.value.length != 0 && billInp.value.length != 0) {
            runUtilityAPI();
        }
    });
}
//Helper determines if there are at least two sub arrays present
export function isSubArray() {
    let c = 0;
    for (let i = 1; i < 6; i++) {
        if (document.getElementById('inp-size-array'+i).value.length !== 0 ) {c++; }
    }
    return c >= 2;
}


export function createPVWattsListeners() {
    //Set up references to html elements to add event listeners  
    let invQuant = document.getElementById("inverter-quantity");
    let batteryQuant = document.getElementById("battery-quantity");
    let batterySlider = document.getElementById('battery-array-slider');
    let solarSlider = document.getElementById('solar-array-slider');

    //Get updating rate slider to recall solar api
    document.getElementById('kwh-slider').addEventListener('input', function() {
        if (solarSlider.value.length != 0 && batterySlider.value.length != 0) {
            // handlePVWattsOutput([]);
            //runGeoAPI([]);
            runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, []));
            //runPVWattsAPI(showResult);
        }
    });

    document.getElementById('residential-rate-inp').addEventListener('change', function() {
        if (solarSlider.value.length != 0 && batterySlider.value.length != 0) {
            //handlePVWattsOutput([]);
            //runGeoAPI([]);
            //runPVWattsAPI(showResult);
            runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, []));
        }
    });

    //Set up button listener to call solar api
    document.getElementById('solar-api').addEventListener('click', function() {
        if (invQuant.value != 0 && batteryQuant.value != 0 ) {
            //After button is pressed once flag it for showing results
            document.getElementById('solar-api').ispressed = 'true';

            if (isSubArray()) { //Check if at least two sub array details are filled out
                console.log("is Sub array");
                let systemData = {
                    pvOutput: 0,
                    solarOutflow: 0,
                    amountStored: 0,
                    gridOutflow: 0,
                    genOutput: 0,
                    genDays: 0,
                    solarConsumption: 0
                };

                if (document.getElementById('inp-size-array1').value !== "0" ) {
                    console.log('params run');
                    runGeoAPI().then(coords => runPVWattsAPI(null, coords, [], document.getElementById('inp-angle-array1').value, document.getElementById('inp-orientation-array1').value, document.getElementById('inp-size-array1').value)
                    .then(res => {
                        console.log(res);
                        updateAnnualData(systemData, res);
                        showResult(systemData);
                        updateTableSubArrays(document.getElementById('residential-rate-inp').value);
                        updateMonthlyTable('all', systemData, document.getElementById('residential-rate-inp').value);

                    }) //Save result from  first sub array call
                    );
                } 
                
                if (document.getElementById('inp-size-array2').value !== "0" ) {
                    runGeoAPI().then(coords => runPVWattsAPI(null, coords, [], document.getElementById('inp-angle-array2').value, document.getElementById('inp-orientation-array2').value, document.getElementById('inp-size-array2').value)
                    .then(res => {
                        console.log(res);
                        updateAnnualData(systemData, res);
                        showResult(systemData);
                        updateTableSubArrays(document.getElementById('residential-rate-inp').value);
                        updateMonthlyTable('all', systemData, document.getElementById('residential-rate-inp').value);

                    }) //Save result from  first sub array call
                    );
                }

                if (document.getElementById('inp-size-array3').value !== "0" ) {
                    runGeoAPI().then(coords => runPVWattsAPI(null, coords, [], document.getElementById('inp-angle-array3').value, document.getElementById('inp-orientation-array3').value, document.getElementById('inp-size-array3').value)
                    .then(res => {
                        console.log(res);
                        updateAnnualData(systemData, res);
                        showResult(systemData);
                        updateTableSubArrays(document.getElementById('residential-rate-inp').value);
                        updateMonthlyTable('all', systemData, document.getElementById('residential-rate-inp').value);
                    }) //Save result from  first sub array call
                    );
                }

                console.log(systemData);
                
                
                //setTimeout(console.log(JSON.stringify(systemData)), 5000);
                //showResult(systemData);
            }
            //If not subarray mode run as usual
            else {
                runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, []));
            }
        }
        
        
        
        // if (document.getElementById('inp-size-array3').value !== "0" ) {
        //     runGeoAPI([], document.getElementById('inp-angle-array3').value, document.getElementById('array3-orientation').value, document.getElementById('inp-size-array3').value);
        // }
        
    });
    //have solar slider recall solar api recalculting data
    document.getElementById('solar-array-slider').addEventListener('input', function() {
        if (solarSlider.value.length != 0 && batterySlider.value.length != 0) {
            //handlePVWattsOutput([]);
            runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, []));
            //runPVWattsAPI(showResult);
        }
    });

    //have battery slider recall battery api recalculting data
    document.getElementById('solar-array-slider').addEventListener('input', function() {
        if (solarSlider.value.length != 0 && batterySlider.value.length != 0) {
            //handlePVWattsOutput([]);
            runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, []));
            //runPVWattsAPI(showResult);
        }
    });

    document.getElementById('recalc-table').addEventListener('click', function() {
        let monthlyConsumption = [];
        for (let i = 0; i < 12; i++) {
            monthlyConsumption.push(parseFloat(document.getElementById('month-' + i.toString()).children[2].innerHTML) / 730);
        }
        console.log(monthlyConsumption);
        runGeoAPI().then(coords => runPVWattsAPI(showResult, coords, monthlyConsumption));
    });
}

//Function reruns PVWatts API with 
export function recalculateResults(coords) {
    let monthlyConsumption = [];
    for (let i = 0; i < 12; i++) {
        monthlyConsumption.push(parseFloat(document.getElementById('month-' + i.toString()).children[2].innerHTML) / 730);
    }
    console.log(monthlyConsumption);
    runPVWattsAPI(showResult, coords, monthlyConsumption);
}