import {isSubArray} from './listeners.js';
import {numberWithCommas} from './index.js';

//NREL Developer API KEY
let api_key = "WkDNJ5GuHQJROwhr64ZgH4Hxu2fc51d3FlKijtsD"

let apiCallACData = {}; //Variabl stores ac data of last PVWatts API Call
let subArrayMonthlyData = {}; //Variable stores sum of monthly data as it is processed

//Initialize sub array monthly data to track sub array sums to update table
for (let i= 0; i < 12; i++) {
    subArrayMonthlyData[i] = {
        pvOutput: 0,
        solarOutflow: 0,
        amountStored: 0,
        gridOutflow: 0,
        genOutput: 0,
        genDays: 0,
        solarConsumption: 0
    };
}

//Run API getting solar data for given location
export function runPVWattsAPI(callBack, coords, monthlyConsumption, tilt, azimuth, solarArraySize) {

    //Define required PVWatts params
    let system_capacity = "1" 
    let module_type = "1"
    let array_type = "1"

    //Pull optional inputs from details section
    if (tilt === undefined) {
        tilt = document.getElementById('inp-tilt').value.toString();
    }
    if (azimuth === undefined) {
        azimuth = document.getElementById('inp-azimuth').value.toString();
    }
    if (solarArraySize === undefined) {
        solarArraySize = document.getElementById('solar-array-slider').value * 0.43;
    }
    let derate = Math.round(document.getElementById('inp-derate').value * 100, 1).toString(); //Losses in percent

    //Define API Call URL
    let rootURL = "https://developer.nrel.gov/api/pvwatts/v6.json?"
    let requiredParameters = "api_key="+api_key+"&system_capacity="+system_capacity+"&module_type="+ module_type + "&array_type=" + array_type + "&timeframe=hourly"
    let detailParameters = "&dc_ac_ratio=1" + "&tilt=" + tilt + "&azimuth=" + azimuth + "&losses=" + derate;
    let addressParameters = "&lat=" + Math.round(parseFloat(coords.lat), 5) + "&lon=" + Math.round(parseFloat(coords.lng), 5);

    try {
        return fetch(rootURL + requiredParameters + detailParameters + addressParameters)
        .then(response => response.json())
        .then(data => {
            // console.log(data);
            apiCallACData = data.outputs.ac;
            if(callBack != null){
                callBack(handlePVWattsOutput(monthlyConsumption, solarArraySize));
            } else {
                console.log("callback less run");
                console.log("solarArraySize: " + solarArraySize);
                return handlePVWattsOutput(monthlyConsumption, solarArraySize);
            }
        });
    } catch(e) {
        console.log(e);
    }
}

//Function used to process PV Watts return data
export function handlePVWattsOutput(monthlyConsumption, solarArraySize) {
    //Variables keep track of what month we are on to populate monthly results
    let daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let currentMonth = 0;
    let daysPast = 0;
    let hourCounter = 1;

    //Initialize object that stores sum of data values as we iterate over all hours
    let systemData = {
        pvOutput: 0,
        solarOutflow: 0,
        amountStored: 0,
        gridOutflow: 0,
        genOutput: 0,
        genDays: 0,
        solarConsumption: 0,
        acData: apiCallACData
    };

    let monthlyData = {
        pvOutput: 0,
        solarOutflow: 0,
        amountStored: 0,
        gridOutflow: 0,
        genOutput: 0,
        genDays: 0,
        solarConsumption: 0,
        acData: apiCallACData
    };

    //Pull input values user put into webpage
    // if (solarArraySize === undefined) {
    //     solarArraySize = document.getElementById('solar-array-slider').value * 0.43;
    // }

    
    let currentOption = document.querySelector("option[value='" + document.getElementById('battery-options').value + "']");
    let batterySize = document.getElementById("battery-quantity").value * parseFloat(currentOption.getAttribute('power'));
    //let batterySize = parseFloat(document.getElementById('battery-array-panels').innerHTML.split(', ')[1].replace('kWh', ''))
    let inverterSize = parseFloat(document.getElementById('inverter-options').value); 
    let inverterQuantity = parseInt(document.getElementById('inverter-quantity').value);
    let additionalCapacity = parseInt(document.getElementById('inp-additional-capacity').value);    //Consumption array allows a consumption value per month defaulted to average consumption
    
    // let averageConsumption = parseInt(document.getElementById('module-kwh').getAttribute('consumption')) / 730; //Your average monthly consumption divided by hours in a month to get Kw
    // console.log(averageConsumption);

    //Every month when input array is not provided
    // let consumptionArray;
    // if (monthlyConsumption.length == 0) {
    //     consumptionArray = Array(12).fill(averageConsumption);
    // } else { 
        
    // }
    let consumptionArray = monthlyConsumption;
    let averageConsumption = consumptionArray.reduce((a, b) => a + b) / consumptionArray.length;

    let pvOutput; //Dc array output hourly
    let solarOutflow; //Flow out of PV
    let amountStored; //Flow to battery
    let gridOutflow; //Flow to grid
    let solarConsumption; //Instant solar consumption
    let batteryCapacity = batterySize + (apiCallACData[0]* solarArraySize/1000) - averageConsumption; //Capacity of battery before current hour runs
    let genChargeStart = 0.2; //What battery capactiy to start charging with generator at
    let genSize = inverterQuantity * inverterSize; //generator charging rate in kW
    let genOutput; //Power generated from grid

    //Initialize generator output
    if (batteryCapacity/batterySize < genChargeStart) {
        genOutput = genSize;
    } else { genOutput = 0; }

    //Save last day generator was run to only increment generator run days once at most every 24 hours
    let lastGeneratorDay;

    //Iterate over all hours of dc solar array output
    //Continously update systemData object with calculated values in for loop mimicking excel
    for (let i = 1; i < apiCallACData.length; i++) {
        if (apiCallACData[i] != 0) { //Make sure value is not 0
            if ((apiCallACData[i] * solarArraySize) / 1000 > (inverterSize * inverterQuantity) + additionalCapacity) { //Check for inverter clipping
                pvOutput = inverterSize * inverterQuantity; 
            } else {
                pvOutput = (apiCallACData[i] * solarArraySize) / 1000; //Store solar array output data in kW
            }
        } else {
            pvOutput = 0;
        }
    
        if (pvOutput - consumptionArray[currentMonth] > 0) { //Row N calc
            solarOutflow = pvOutput - consumptionArray[currentMonth];
        } else { 
            solarOutflow = 0; 
        }

        //Uses battery capacity from iteration i-1, mimic going a row back in the excel
        if (solarOutflow + batteryCapacity > batterySize) { //Row O calc
            //amountStored = solarOutflow- (batteryCapacity + solarOutflow - batterySize);
            amountStored = batterySize - batteryCapacity;
        } else {
            amountStored = solarOutflow;
        }

        gridOutflow = solarOutflow - amountStored; //Row P calc

        solarConsumption = pvOutput - gridOutflow; //Row M Calc

        if (batteryCapacity + pvOutput + genOutput - consumptionArray[currentMonth] < batterySize) { //Row Q calc
            batteryCapacity = batteryCapacity + pvOutput + genOutput - consumptionArray[currentMonth]
        } else {
            batteryCapacity = batterySize;
        }

        //Generator was run condition
        if (batteryCapacity/batterySize < genChargeStart) {
            if (lastGeneratorDay == 'undefined') {
                lastGeneratorDay = Math.floor(i/24);
            }
            genOutput = genSize;
            let currentDay = Math.floor(i/24);
            if (currentDay != lastGeneratorDay) { //Increment generator days once a 24hour period
                monthlyData['genDays'] = monthlyData['genDays'] + 1;
                lastGeneratorDay = currentDay;
            }
        } else { 
            genOutput = 0; 
        }

        //Update monthly Data
        monthlyData['pvOutput'] = monthlyData['pvOutput'] + pvOutput;
        monthlyData['solarOutflow'] = monthlyData['solarOutflow'] + solarOutflow;
        monthlyData['amountStored'] = monthlyData['amountStored'] + amountStored;
        monthlyData['gridOutflow'] = monthlyData['gridOutflow'] + gridOutflow;
        monthlyData['genOutput'] = monthlyData['genOutput'] + genOutput;
        monthlyData['solarConsumption'] = monthlyData['solarConsumption'] + solarConsumption;

        //After completing all calculations increment hours run
        hourCounter++;
        
        if (hourCounter == 24) { //Check if day is complete
            daysPast++;
            hourCounter = 0; 

            if (daysPast == daysPerMonth[currentMonth]){ //check if month is complete
                //Populate table row with data
                if (!isSubArray()) {  //if not in sub array mode
                    console.log('NOT SUB ARRAY MODE');
                    updateMonthlyTable(currentMonth, monthlyData, consumptionArray[currentMonth] * 730);
                    //Add completed month data to annual, reset month data
                    systemData = updateAnnualData(systemData, monthlyData);
                    monthlyData = resetMonthlyData(monthlyData);
                }
                else { //save monthly data to aggregate it after all sub arrays are done
                    systemData = updateAnnualData(systemData, monthlyData); 
                    Object.keys(subArrayMonthlyData[currentMonth]).forEach(key => { //Save monthly data
                        subArrayMonthlyData[currentMonth][key] = subArrayMonthlyData[currentMonth][key] + monthlyData[key];
                    });
                    monthlyData = resetMonthlyData(monthlyData);
                }
                daysPast = 0; //Reset days iterated over this month
                currentMonth++; //Move on to next month

            }
        }
    }

    //Update total row of table with systemData
    console.log("Sub array status: " + isSubArray());
    if (!isSubArray()) {
        updateMonthlyTable('all', systemData, consumptionArray.reduce((a, b) => a + b, 0) * 730);
    } 
    // else { 
    //     updateMonthlyTable('all', subArrayMonthlyData, consumptionArray.reduce((a, b) => a + b, 0) * 730);
    // }
    return systemData; 
}

//For each months' data stored in subArrayMonthlyDay update the results table
export function updateTableSubArrays(consumption) {
    for (let i = 0; i < 12; i++) {
        updateMonthlyTable(i, subArrayMonthlyData[i], consumption);
    }
}

//Retrievs appropriate row of monthly results table and populates cells
export function updateMonthlyTable(monthIndex, data, averageConsumption) {
    var tableCells = document.getElementById('month-' + monthIndex).children;
    tableCells[1].innerHTML = Math.round(data['pvOutput']);
    tableCells[2].innerHTML = Math.round(averageConsumption);
    //Add event listener to change total when a month value is changed
    if (monthIndex != 'all') {
        tableCells[2].setAttribute('contenteditable',"true"); //Allow users to modify monthly consumption
        tableCells[2].addEventListener('input', () => {
            //Update total after a cell is changed
            document.getElementById('month-all').children[2].innerHTML = sumMonthConsumption();
        });
    } else {
        tableCells[2].innerHTML = sumMonthConsumption();
    }

    tableCells[3].innerHTML = Math.round(data['solarConsumption']);
    tableCells[4].innerHTML = Math.round(data['genOutput']);
    tableCells[5].innerHTML = Math.round(data['gridOutflow']);
    
    //Cap gen days at one year if using sub arrays
    if (data['genDays'] > 365) {data['genDays'] = 365;}
    tableCells[6].innerHTML = data['genDays'];
}

//Sum over month consumption of all months and 
function sumMonthConsumption() {
    let sum = 0;
    //Compute sum of month consumption values
    for (let i = 0; i < 12; i++) {
        sum += parseFloat(document.getElementById('month-' + i.toString()).children[2].innerHTML);
    }
    console.log('Sum is: ' + sum);
    return sum;
}

//Updates annual data everytime a month is done running
export function updateAnnualData(annual, monthly) {
    Object.keys(annual).forEach(key => {
        if (key != 'acData') {
            annual[key] = annual[key] + monthly[key];
        }
    });
    return annual;
}

//Reset system data to 0 when month is done running
function resetMonthlyData(monthly) {
    Object.keys(monthly).forEach(key => {
        if (key != 'acData') {
            monthly[key] = 0;
        }
    });
    return monthly;
};
