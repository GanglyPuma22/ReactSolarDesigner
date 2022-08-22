//NREL Developer API KEY
let api_key = "WkDNJ5GuHQJROwhr64ZgH4Hxu2fc51d3FlKijtsD"

const zipCodeInp = document.getElementById("zip-code");
const billInp = document.getElementById("monthly-bill");

//Variables store information on HTML elements in the page
let lastDropDownVal;

export function runUtilityAPI(zipCode, bill) {
    if (zipCode.length != 0 && bill.length != 0) {
        //Utility Rates API
        let utility_root_url = "https://developer.nrel.gov/api/utility_rates/v3.json?"
        let utility_parameters = "api_key=" + api_key + "&address=" + zipCode;
        try {
            return fetch(utility_root_url + utility_parameters)
            .then(response => response.json())
            //.then(data => handleUtilityResult(data.outputs.residential));
            .then(data => {
                return Math.round(bill / data.outputs.residential);
            });
        } catch(e) {
            console.log(e);
        }
    } else {
        console.log("Input missing for API call")
    } 

}

//Function displays the electricity consumptions and sets up event listener for dropdown
function handleUtilityResult(electricRate) {
    let monthlyConsumption = Math.round(billInp.value / electricRate);
    let kwhModule =  document.getElementById('module-kwh')
    kwhModule.setAttribute('consumption', monthlyConsumption)
    let rateInp = document.getElementById('residential-rate-inp');
    rateInp.value = monthlyConsumption;

    let dropDown = document.getElementById('output-options');
    lastDropDownVal = dropDown.value;
    let slider = document.getElementById('kwh-slider');
    slider.value = monthlyConsumption;

    //Create event listener that updates slider when rate input is changed
    rateInp.addEventListener('change', function () {
        slider.value = rateInp.value;    
        setMonthlyConsumption(); //Make sure consumption attribute always in monthly form
    })

    //Create event listener that modifies kwh input based on display option
    dropDown.addEventListener('change', function () {
        let multiplier = 1;
        switch(lastDropDownVal) {
            case 'month':
                if (dropDown.value == 'day') {
                    multiplier = 1/30;
                } else if (dropDown.value == 'year') {
                    multiplier = 12/1000;
                }
                break;
            case 'day':
                if (dropDown.value == 'month') {
                    multiplier = 30;
                } else if (dropDown.value == 'year') {
                    multiplier = 365/1000;
                }
                break;
            case 'year':
                if (dropDown.value == 'month') {
                    multiplier = (1/12)*1000;
                } else if (dropDown.value == 'day') {
                    multiplier = (1/365)*1000;
                }
                break;
        }
          lastDropDownVal = dropDown.value;
          slider.max = multiplier * slider.max;
          rateInp.value = Math.round(multiplier * rateInp.value);
          slider.value = rateInp.value;
    });

    //Create event listener updating input value when slider is modified
    slider.addEventListener('input', function() {
        rateInp.value = parseInt(slider.value);
        setMonthlyConsumption(); //Make sure consumption attribute always in monthly form
    });

    var kwhRect = kwhModule.getBoundingClientRect();
    var systemInfoModule = document.getElementById('module-system-information');
    var fortressSystemModule = document.getElementById('module-fortress-system');

    // systemInfoModule.style.top = kwhRect.height * 1.5;
    // fortressSystemModule.style.top = systemInfoModule.getBoundingClientRect().height * 1.5;
    document.getElementById('utility-results').style.display = 'block';
    systemInfoModule.style.display = 'block';
    fortressSystemModule.style.display = 'block';

}

//Function updates attribute of div id = module-kwh to store monthly consumption for data processing later
function setMonthlyConsumption() {
    let consumptionFactor = 1;
    let dropDown = document.getElementById('output-options');
    let rateInp = document.getElementById('residential-rate-inp');

    if (dropDown.value == 'day') {  
        consumptionFactor = 30;
    } else if (dropDown.value == 'year') {
        consumptionFactor = (1/12)*1000;
    } 
    document.getElementById('module-kwh').setAttribute('consumption', parseInt(rateInp.value * consumptionFactor));
}

export function getMonthlyConsumption() {
    let consumptionFactor = 1;
    let dropDown = document.getElementById('output-options');
    let rateInp = document.getElementById('residential-rate-inp');
    console.log(dropDown.value);

    if (dropDown.value == 'day') {  
        consumptionFactor = 30;
    } else if (dropDown.value == 'year') {
        consumptionFactor = (1/12)*1000;
    } 
    return parseInt(rateInp.value * consumptionFactor);
    //document.getElementById('module-kwh').setAttribute('consumption', parseInt(rateInp.value * consumptionFactor));
}

export function getNewMultiplier(drpdownVal) {
    console.log(drpdownVal);
    if (drpdownVal === 'day') {
        return 1/30;
    } else if (drpdownVal === 'year') {
        return 12/1000;
    } else {
        return 1;
    }
}

export function computeNewConsumption(lastDropDownVal) {
    console.log(lastDropDownVal);
    let dropDown = document.getElementById('output-options');
    let multiplier = 1;
        switch(lastDropDownVal) {
            case 'month':
                if (dropDown.value == 'day') {
                    multiplier = 1/30;
                } else if (dropDown.value == 'year') {
                    multiplier = 12/1000;
                }
                break;
            case 'day':
                if (dropDown.value == 'month') {
                    multiplier = 30;
                } else if (dropDown.value == 'year') {
                    multiplier = 365/1000;
                }
                break;
            case 'year':
                if (dropDown.value == 'month') {
                    multiplier = (1/12)*1000;
                } else if (dropDown.value == 'day') {
                    multiplier = (1/365)*1000;
                }
                break;
        }
          return multiplier;
        //   lastDropDownVal = dropDown.value;
        //   slider.max = Math.round(multiplier * slider.max);
        //   rateInp.value = Math.round(multiplier * rateInp.value);
        //   slider.value = rateInp.value;
}