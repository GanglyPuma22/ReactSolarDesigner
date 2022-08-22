import fortressLogo from './fortress_logo.png'
import './App.css';
import React from 'react';
import { useRef, useState, useEffect} from 'react';
import {runUtilityAPI, getMonthlyConsumption, computeNewConsumption, getNewMultiplier} from './utilityRates-API.js';
import {runPVWattsAPI, updateTableSubArrays, updateAnnualData, updateMonthlyTable} from './pvWatts-API.js';
import {runGeoAPI} from './googleMaps-API.js';
import {isSubArray, handleBatterySlider, updateBatterySystemText, updateSolarSlider, recalculateResults} from './listeners.js';
import {showResult} from './index.js';
//import {SubArray} from './subArrayComponent.js';
//import {removeSubArray} from './subArrayComponent.js';
import { FaTrash } from 'react-icons/fa';

let subArrayCount = 1;

export function decrementSubArrayCount() {
    subArrayCount--;
    console.log(subArrayCount);
}

export function App() {
  const zipRef = useRef(null);
  const billRef = useRef(null);
  const utilityRef = useRef(null);
  const utilitySliderRef = useRef(null);
  const invQuantRef = useRef(null);
  const inverterBatteryDiv = useRef(null);
  const consumptionTypeRef = useRef(null);
  const subArrayDiv = useRef(null);
  const batteryQuantRef = useRef(null);
  const batterySliderRef = useRef(null);

  let lastConsumptionType = 'month';

  let elecRate;
  //Margin values used when showing/hiding optional details and solar details
  // let optionalMargin = 50;
  // let subArrayMargin = 130;

  //Sets state to active to show remaining modules after 
  const [isActive, setIsActive] = useState(false);
  //Show/Hide optional solar details
  const [optionalActive, setOptionalActive] = useState(false);
  //Show/Hide optional sub array details
  const [subArrayActive, setSubArrayActive] = useState(false);
  //Sets solar array slider state, default to 0
  const [solarValue, changeSolarValue] = useState(0)
  //Sets battery array slider state, default to 0
  const [batteryValue, changeBatteryValue] = useState(0)
  //Sets consumption slider state always in monthly form, default to 0
  const [consumptionValue, changeConsumptionValue] = useState(0)
  //Sets inverter quantity state, default to 0
  const [inverterValue, changeInverterValue] = useState(0)
  //Stores google maps coords
  const [googleCoords, changeGoogleCoords] = useState({});
  //Sets margin size state
  const [subArrayMargin, changeSubArrayMargin] = useState(0);
  //Tracks active sub arrays
  const [activeSubArray, updateSubArrays] = useState({1: true, 2:false, 3: false, 4: false, 5: false});

  //When checkboxes for optional details and sub arrays are clicked update margins
  useEffect(() => {
    changeSubArrayMargin(getMargin());
  }, [optionalActive, subArrayActive]);

  //Function removes sub array from visuals and clears its data
  function removeSubArray(num) {
    //Clear inputs
    document.getElementById('inp-size-array'+ num.toString()).value = '';
    document.getElementById('inp-angle-array'+ num.toString()).value = '';
    document.getElementById('inp-orientation-array'+ num.toString()).value = '';
    //Remove sub array num from visibility
    let tempState = activeSubArray;
    tempState[num] = false;
    updateSubArrays(tempState);
    //Update Margin
    changeSubArrayMargin(getMargin());
  }

  //Count the number of sub arrays currently in use
  function getSubArrayNum() {
    return Object.values(activeSubArray).reduce((a, item) => a + item, 0)
  }

  //Shows row for a new sub array
  function showSubArray(num) {
      //Update sub array state with current num sub array
      let tempState = activeSubArray;
      tempState[num] = true;
      updateSubArrays(tempState);
      changeSubArrayMargin(getMargin());
  } 

  //Check which number is the next non displayed sub array
  function nextFreeSubArray() {
    let num = 1;
    while(document.getElementById('array'+ num.toString() + '-wrapper') != null) { //Iterate over sub arrays
      if (document.getElementById('array'+ num.toString() + '-wrapper').style.display == 'none') { //Which ever one is not displayed is the next to use
        return num;
      }
      num++;
    }
    //If returns 6 no free sub arrays
    return num;
  }

  //Computes what the current margin should be based on which chboxes are clicked and how many sub arrays visible
  function getMargin() {
    let val = 0;
    if (optionalActive && subArrayActive) { //Both chboxes active, 110 plus 50 for each sub array
      let extraSpace = (getSubArrayNum()-1) * 50;
      val = 110 + extraSpace;
    } else if(optionalActive) { val = 50;} //Just optional details active, hardcoded 50
    return val; 
  }

  //Function runs both the geo and utility apis after entering address, 
  function handleUtilityAndGeo() {
    if (zipRef.current.value.length !== 0) {
      //Run Geo api once and save coords in state
      runGeoAPI(zipRef.current.value).then(coords => changeGoogleCoords(coords));
      //Run Utility API 
      runUtilityAPI(zipRef.current.value, billRef.current.value).then(consumption => 
        {
          utilityRef.current.value = consumption;
          utilitySliderRef.current.value = consumption;
          changeConsumptionValue(getMonthlyConsumption())
        });
    }
    
  }

  //Function runs pvWatts on sub arrays if more than 2 are present, or in regular mode
  function runPVWatts() {
    console.log(googleCoords);

    //Check that data is not empty
    if (inverterValue !== 0 && batteryValue !== 0 ) { 
        //Check if at least two sub array details are filled out and the subarray checkbox is checked
        if (isSubArray() && subArrayActive) { 
            console.log("RUNNING AS SUB ARRAY");
            let systemData = {
                pvOutput: 0,
                solarOutflow: 0,
                amountStored: 0,
                gridOutflow: 0,
                genOutput: 0,
                genDays: 0,
                solarConsumption: 0
            };

            //Iterate over all possible sub arrays only calling pvwatts on those whose size is filled out
            for (let i = 1; i < 6; i++) {
              if (document.getElementById('inp-size-array' + i).value.length !== 0) {
                console.log(i);
                console.log("Size: " + document.getElementById('inp-size-array' +i).value);
                console.log("Angle: " + document.getElementById('inp-angle-array'+i).value);
                runPVWattsAPI(null, googleCoords, Array(12).fill(consumptionValue/730), document.getElementById('inp-angle-array'+i).value, document.getElementById('inp-orientation-array'+i).value, document.getElementById('inp-size-array' +i).value)
                .then(res => {
                    console.log(res);
                    updateAnnualData(systemData, res);
                    showResult(systemData);
                    updateTableSubArrays(consumptionValue);
                    updateMonthlyTable('all', systemData, consumptionValue);
                }); //Save result from  each sub array call
              }
            }
        }
        //If not subarray mode run as usual
        else {
            console.log(getMonthlyConsumption());
            runPVWattsAPI(showResult, googleCoords, Array(12).fill(consumptionValue/730));
        }
    }
  }

  //Define sub array component thats reused for each one
  function SubArray(props) {
    return <div id={props.id} style={props.style} className="sub-array"> 
    <div className = "array-size" id={'array' + props.number + '-size'}>
      <p className="angle"> Sub Array {props.number} Size(kW): </p>
      <input className="angle" id={'inp-size-array' + props.number} type="number" min = "0" style={{width: '50px'}}/>
    </div>
    <div className = "array-angle" id={'array' + props.number + '-angle'}>
      <p className="angle"> Tilt Angle: </p>
      <input className="angle" id={'inp-angle-array' + props.number} type="number" min = "0" style={{width: '50px'}}/>
    </div>
    <div className = "array-orientation" id={'array' + props.number + '-orientation'}>
      <p className="angle"> Orientation: </p>
      <input className="angle" id={'inp-orientation-array' + props.number} type="number" min = "0" style={{width: '50px'}}/>
    </div>
    <FaTrash className = 'remove-subarray' id={'remove-subarray' + props.number} onClick = {() => {removeSubArray(props.number);}}/>
  </div>
  ;
  }

  return (
    <div className="SystemDesigner">
      <h1 id ='title-text'> Fortress System Designer </h1>
      <img src={fortressLogo} id="fortress-logo" alt="fortressLogo"/>
      <button> Test </button>
      <div className= "module" id="module-kwh"> 
        <form className="form-inline">
            <div className="zip-form-group">
                <label for="zip-code" className='big-font'>Enter your address: </label>
                <input type="text" className="form-control" id="zip-code" name="zipcode" placeholder="Address" ref = {zipRef} /> 
            </div>
            <br/> 
            <div className="bill-form-group">
                <label for="monthly-bill" className='big-font'>Enter your monthly electric bill: </label>
                <input type="number" className="form-control" id="monthly-bill" placeholder="Monthly Electric Bill" ref={billRef}/> 
                <button className="form-control" type="button" id = "utility-api" onClick={() => { 
                handleUtilityAndGeo(); 
                //Activating shows other modules
                setIsActive(true);
                }}>Get kWh estimates</button>
            </div>
        </form>
      </div> 

      <div className= "module" id="module-system-information"   style={{display: isActive ? 'block' : 'none'}}>
        <p className= "big-font" id = "solar-details-text"> Enter optional solar details: </p> 
        <input type="checkbox" id="solar-details" name="solar-details" value="hide" onChange={() => {setOptionalActive(!optionalActive); }}/>
        <div id="optional-details" style={{display: optionalActive ? 'inline-block' : 'none'}}>
          <div id="tilt-wrapper"> 
            <p className="angle"> Tilt angle: </p>
            <input className="angle" id="inp-tilt" type="number" min = "0" max="90" value = "20"/>
          </div>
          <br/>
          <div id="azimuth-wrapper"> 
            <p className= "angle"> Azimuth angle:</p>
            <input className="angle" id="inp-azimuth" type="number" min = "0" max="359" value = "180"/>
          </div>
          <div id="derate-wrapper">
            <p className= "angle"> Derate factor:</p>
            <input className="angle" id="inp-derate" type="number" step="0.01" min = "-0.05" max="0.99" value = "0.14"/>
          </div>
          <div id="inverter-capacity-wrapper">
            <p className= "angle"> Additional Inverter Capacity:</p>
            <input className="angle" id="inp-additional-capacity" type="number" step="1" min="0" value="0"/>
          </div> 
            <div id="sub-array" >
            <p className= "angle" id = "sub-array-text"> Optional Sub Arrays: </p> 
            <input type="checkbox" id="sub-array-box" name="sub-array-details" value="hide" onChange={() => { setSubArrayActive(!subArrayActive);}}/>
            <div id="sub-array-details" ref={subArrayDiv} style={{display: subArrayActive ? 'inline-block' : 'none'}}> 
                <hr id='hr1' style={{ display: activeSubArray[1] ? 'block' : 'none'}}/>
                <SubArray number='1' id='array1-wrapper' style={{ display: activeSubArray[1] ? 'block' : 'none'}}> </SubArray>
                <hr id='hr2' style={{ display: activeSubArray[2] ? 'block' : 'none'}}/>
                <SubArray number='2' id='array2-wrapper' style={{ display: activeSubArray[2] ? 'block' : 'none'}}> </SubArray>
                <hr id='hr3' style={{ display: activeSubArray[3] ? 'block' : 'none'}}/>
                <SubArray number='3' id='array3-wrapper' style={{ display: activeSubArray[3] ? 'block' : 'none'}}> </SubArray>
                <hr id='hr4' style={{ display: activeSubArray[4] ? 'block' : 'none'}}/>
                <SubArray number='4' id='array4-wrapper' style={{ display: activeSubArray[4] ? 'block' : 'none'}}> </SubArray>
                <hr id='hr5' style={{ display: activeSubArray[5] ? 'block' : 'none'}}/>
                <SubArray number='5' id='array5-wrapper' style={{ display: activeSubArray[5] ? 'block' : 'none'}}> </SubArray>
                <button id="add-sub-array" style = {{display: getSubArrayNum() === 5 ? 'none' : 'block'}}onClick={() => {showSubArray(nextFreeSubArray());}}> Add Sub Array</button>  
            </div>
          </div>
        </div> 
        <div id="inverter-battery" ref={inverterBatteryDiv} style={{marginTop: subArrayMargin + 'px'}}>
          <div id="inverter-details"> 
            <div id = 'inverter-options-wrapper'>
              <label for="inverter-options" className= "big-font">Choose an inverter size:</label> 
              <select id="inverter-options">
                <option hidden disabled selected value> -- select an option -- </option>
                <option value="7.6"> 7.6 kW</option>
                <option value="12"> 12 kW</option>
                <option value="125"> 125 kW</option>
              </select>
            </div>
            <div id = 'inverter-quantity-wrapper'>
              <label id = "label-inverter-quantity" for="inverter-quantity" className= "big-font"> Enter the inverter amount: </label> 
              <input id = "inverter-quantity" type="number" min = '0' style = {{width: '50px'}} value={inverterValue} ref={invQuantRef} onChange={(e) => {
                changeInverterValue(e.target.value);
                changeSolarValue(updateSolarSlider());
                changeBatteryValue(updateBatterySystemText(Math.round(solarValue * 0.43))); }}/>
            </div>
          </div>
          <div id="battery-details"> 
            <div id = 'battery-options-wrapper'> 
              <label for="battery-options" className= "big-font">Choose a Fortress Battery model:</label> 
              <select id="battery-options">
                <option hidden disabled selected value> -- select an option -- </option>
                <option value="eFlex" power="5.4" max="16"> eFlex (5.4 kWh) </option>
                <option value="eVault Max" power="18.5" max="20"> eVault Max (18.5 kWh) </option>
                <option value="eSpire" power="233" max="15"> eSpire (233 kWh) </option>
              </select>
            </div>
            <div id="battery-quantity-wrapper">
              <label id = "label-battery-quantity" for="battery-quantity" className= "big-font"> Enter the battery amount: </label> 
              <input id = "battery-quantity" type="number" min = '0' style = {{width: '50px'}} max={3*inverterValue} value={batteryValue} onChange={() => changeBatteryValue(updateBatterySystemText(Math.round(solarValue * 0.43)))}/>
            </div>
          </div>
        </div>
      </div>
    
      <div className="module" id="module-fortress-system"  style={{display: isActive ? 'block' : 'none', marginTop: subArrayMargin + 'px'}}>
        <h2 id ='fortress-module-text'> Your Fortress System: </h2> 

        <div id = "utility-results"> 
          <p className= "big-font" id = "average-electricity-text"> Your average electricity consumption is: </p>
          <div id = 'electric-consumption'> 
            <input id = "residential-rate-inp" type = "number" ref={utilityRef} onChange={() => {utilitySliderRef.current.value = utilityRef.current.value;
                                                                                                changeConsumptionValue(getMonthlyConsumption());
                                                                                                console.log('Consumption value is: ' + consumptionValue);
                                                                                                }}/> 
                                                                                                
            <select name="output-options" id="output-options" ref={consumptionTypeRef} onChange ={(e) => {
                let multiplier = getNewMultiplier(consumptionTypeRef.current.value);
                let newConsumption = multiplier * consumptionValue;
                console.log('New Consumption is: ' + newConsumption);
                utilitySliderRef.current.max = Math.round(multiplier * parseInt(utilitySliderRef.current.max));
                utilityRef.current.value = Math.round(newConsumption);
                utilitySliderRef.current.value = Math.round(newConsumption);
                // let mult = computeNewConsumption(lastConsumptionType);
                // console.log(mult);
                // utilityRef.current.value = Math.round(utilityRef.current.value * mult);
                // utilitySliderRef.current.max = Math.round(utilitySliderRef.current.max * mult);
                // utilitySliderRef.current.value = utilityRef.current.value;
                // console.log('Consumption value is: ' + consumptionValue);
                // lastConsumptionType = consumptionTypeRef.current.value;

            }}>
              <option value="month" selected> kWh / Month</option>
              <option value="day"> kWh / Day</option>
              <option value="year"> MWh / Year</option>
            </select>
          </div>
          <input type="range" min="1" max="4500" step = "1" id = "kwh-slider" ref={utilitySliderRef} onChange={() => {utilityRef.current.value = utilitySliderRef.current.value
                                                                                                                      changeConsumptionValue(getMonthlyConsumption());
                                                                                                                      console.log('Consumption value is: ' + consumptionValue);}}/>
        </div>
      
        <div className= 'array-details' id = "solar-array-details">
          <label className= 'big-font' id = "solar-array-label" for="solar-array-slider"> Enter solar array details: </label> 
          <input id = "solar-array-slider" value={solarValue} onChange={(e) => {changeSolarValue(e.target.value);                                                                
          }} type="range" min = '0' step = '1' max = '1454'/>
          <p className="big-font" id = "solar-array-panels"> {solarValue + ' panels, ' + Math.round(solarValue*0.43) + ' kW'} </p>
        </div>

        <div id = "battery-system-details">
          <div className= 'array-details' id = "battery-array-details">
            <label className= 'big-font' id = "battery-array-label" for="battery-array-slider"> Fortress Battery system details: </label> 
            <input id = "battery-array-slider" type="range" value={batteryValue} max={inverterValue * 3} onChange={(e) => {changeBatteryValue(e.target.value);
             //handleBatterySlider();
             updateBatterySystemText(Math.round(solarValue * 0.43));                                                                                       
            }} min='0' step = '1' />
            <p className="big-font" id = "battery-array-panels" style={{display: 'inline-block'}}> {batteryValue + 'kWh'} </p>
          </div>
        </div>

        <button type="button" id = "solar-api" ispressed = 'false' onClick={runPVWatts}>Get System Data </button>
        <div id = 'system-results'>
          <p id = 'gen-days' className= "big-font"> </p>
          <p id = 'self-reliance' className= "big-font"> </p>
          <p id = 'percent-offset' className= 'big-font'> </p>
          <p id = 'solar-production' className= "big-font"> </p>
          <p id = 'solar-consumption' className= "big-font"> </p>
        </div>
        <div id="recalc-wrapper"> 
          <p id="monthly-consumption-text" className="angle" style={{margin: '0'}}> Change monthly consumption values: </p>
          <button type="button" id="recalc-table" onClick={() => recalculateResults(googleCoords)}> Recalculate </button>
        </div>

        <div id = "monthly-results">
          <table className="tg">
            <thead>
              <tr>
                <th className="tg-ujgf">Month</th>
                <th className="tg-ubgt">Solar Energy Production<br/>(kWh)</th>
                <th className="tg-ubgt">Total Consumption<br/>(kWh) <i id='consumption-icon' className="fa-solid fa-circle-info"></i> </th>
                <th className="tg-ubgt">Solar Consumption<br/>(kWh)</th>
                <th className="tg-ubgt">Grid Consumption<br/>(kWh)</th>
                <th className="tg-ubgt">Grid Sellback<br/>(kWh)</th>
                <th className="tg-ujgf">Days of Gen Use</th>
              </tr>
            </thead>
            <tbody>
              <tr id='month-0'>
                <td className="tg-m3bo"><span style={{fontWeight: 'bold'}}>January</span></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-1'>
                <td className="tg-h1fx">February</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-2'>
                <td className="tg-2rcr">March</td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-3'>
                <td className="tg-h1fx">April</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-4'>
                <td className="tg-2rcr">May</td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-5'>
                <td className="tg-h1fx">June</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-6'>
                <td className="tg-2rcr">July</td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-7'>
                <td className="tg-h1fx">August</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-8'>
                <td className="tg-2rcr">September</td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-9'>
                <td className="tg-h1fx">October</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-10'>
                <td className="tg-2rcr">November</td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc consumption"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
                <td className="tg-jerc"></td>
              </tr>
              <tr id='month-11'>
                <td className="tg-h1fx">December</td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6 consumption"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
                <td className="tg-huh6"></td>
              </tr>
              <tr id='month-all'>
                <td className="tg-ujgf">Total</td>
                <td className="tg-c6of"></td>
                <td className="tg-c6of"></td>
                <td className="tg-c6of"></td>
                <td className="tg-c6of"></td>
                <td className="tg-c6of"></td>
                <td className="tg-c6of"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id = 'email-results'>
                <h2 style={{marginBottom: '0px'}}> Save Results: </h2>
                <p className= 'big-font' id = "email-label"> Enter your email to recieve system data: </p>
                <div id = 'email-input-container'> 
                  <div id="email-wrapper">
                    <input id="email-input" type="text" value=""/>
                    <button type ="button" className="g-recaptcha" id ='captcha-button' 
                      style={{display:'inline', verticalAlign: 'top'}}
                      data-callback = 'sendEMail'
                      data-sitekey="6LdgW7cgAAAAAMgiL8OuFtmQnp4Tvlhn59f2zFsf" 
                      data-action='submit'> Submit
                    </button>
                  </div>
               </div>
         </div> 

        <div id="consumption-popup-wrapper" className="popup">
              <span className="popuptext" id="consumption-popup">Typical AC units run on 3000W. Typical space heaters run on 1500W. Typical HVAC systems run on 3500W </span>
        </div>

      </div>

    </div>
    )
}

export default App;
/* <h1 id ='title-text'> Fortress System Designer </h1>
<img src="fortress_logo.png" id="fortress-logo" alt="fortressLogo"/>
<div id="app-content"> 
    <h2> Enter your desired system information: </h2> 
    <div className= "module" id="module-kwh"> 
        <form role="form" className="form-inline">
            <div className="zip-form-group">
                <label for="zip-code" className='big-font'>Enter your address: </label>
                <input type="text" className="form-control" id="zip-code" placeholder="Address"/> 
            </div>
            <br/>
            <div className="bill-form-group">
                <label for="monthly-bill" className='big-font'>Enter your monthly electric bill: </label>
                <input type="number" className="form-control" id="monthly-bill" placeholder="Monthly Electric Bill"/> 
                <button className="form-control" type="button" id = "utility-api">Get kWh estimates</button>
            </div>
        </form>
    </div>
    <div className= "module" id="module-system-information">
      <p className= "big-font" id = "solar-details-text"> Enter optional solar details: </p> 
      <input type="checkbox" id="solar-details" name="solar-details" value="hide"/>
      <div id="optional-details">
        <div id="tilt-wrapper"> 
          <p className="angle"> Tilt angle: </p>
          <input className="angle" id="inp-tilt" type="number" min = "0" max="90" value = "20"/>
        </div>
        <br/>
        <div id="azimuth-wrapper"> 
          <p className= "angle"> Azimuth angle:</p>
          <input className="angle" id="inp-azimuth" type="number" min = "0" max="359" value = "180"/>
        </div>
        <div id="derate-wrapper">
          <p className= "angle"> Derate factor:</p>
          <input className="angle" id="inp-derate" type="number" step="0.01" min = "-0.05" max="0.99" value = "0.14"/>
        </div>
        <div id="inverter-capacity-wrapper">
          <p className= "angle"> Additional Inverter Capacity:</p>
          <input className="angle" id="inp-additional-capacity" type="number" step="1" min="0" value="0"/>
        </div>
      </div> 
      <div id="sub-array">
        <p className= "big-font" id = "sub-array-text"> Optional Sub Arrays: </p> 
        <input type="checkbox" id="sub-array-box" name="sub-array-details" value="hide"/>
        <div id="sub-array-details"> 
            <div id="array1-wrapper" className="sub-array"> 
              <div id="array1-size">
                <p className="angle"> Sub Array 1 Size(kW): </p>
                <input className="angle" id="inp-size-array1" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array1-angle">
                <p className="angle"> Tilt Angle: </p>
                <input className="angle" id="inp-angle-array1" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array1-orientation">
                <p className="angle"> Orientation: </p>
                <input className="angle" id="inp-orientation-array1" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
            </div>

            <div id="array2-wrapper" className="sub-array"> 
              <div id="array2-size">
                <p className="angle"> Sub Array 2 Size(kW): </p>
                <input className="angle" id="inp-size-array2" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array2-angle">
                <p className="angle"> Tilt Angle: </p>
                <input className="angle" id="inp-angle-array2" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array2-orientation">
                <p className="angle"> Orientation: </p>
                <input className="angle" id="inp-orientation-array2" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
            </div>

            <div id="array3-wrapper" className="sub-array"> 
              <div id="array3-size">
                <p className="angle"> Sub Array 3 Size(kW): </p>
                <input className="angle" id="inp-size-array3" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array3-angle">
                <p className="angle"> Tilt Angle: </p>
                <input className="angle" id="inp-angle-array3" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
              <div id="array3-orientation">
                <p className="angle"> Orientation: </p>
                <input className="angle" id="inp-orientation-array3" type="number" min = "0" value = "0" style={width: '50px'}/>
              </div>
            </div>
        </div>
      </div>
      <div id="inverter-battery">
        <div id="inverter-details"> 
          <div id = inverter-options-wrapper>
            <label for="inverter-options" className= "big-font">Choose an inverter size:</label> 
            <select id="inverter-options">
              <option hidden disabled selected value> -- select an option -- </option>
              <option value="7.6"> 7.6 kW</option>
              <option value="12"> 12 kW</option>
              <option value="125"> 125 kW</option>
            </select>
          </div>
          <div id = inverter-quantity-wrapper>
            <label id = "label-inverter-quantity" for="inverter-quantity" className= "big-font"> Enter the inverter amount: </label> 
            <input id = "inverter-quantity" type="number" min = '0' value = "0" style = {width: '50px'}/>
          </div>
        </div>
        <div id="battery-details"> 
          <div id = battery-options-wrapper> 
            <label for="battery-options" className= "big-font">Choose a Fortress Battery model:</label> 
            <select id="battery-options">
              <option hidden disabled selected value> -- select an option -- </option>
              <option value="eFlex" power="5.4" max="16"> eFlex (5.4 kWh) </option>
              <option value="eVault Max" power="18.5" max="20"> eVault Max (18.5 kWh) </option>
              <option value="eSpire" power="233" max="15"> eSpire (233 kWh) </option>
            </select>
          </div>
          <div id="battery-quantity-wrapper">
            <label id = "label-battery-quantity" for="battery-quantity" className= "big-font"> Enter the battery amount: </label> 
            <input id = "battery-quantity" type="number" min = '0' value = "0" style = {width: '50px'}/>
          </div>
        </div>
      </div>
    </div>
    <div className="module" id="module-fortress-system">
      <h2 id ='fortress-module-text'> Your Fortress System: </h2> 
      <div id = "utility-results"> 
        <p className= "big-font" id = "average-electricity-text"> Your average electricity consumption is: </p>
        <div id = 'electric-consumption'> 
          <input id = "residential-rate-inp" type = "number" /> 
          <select name="output-options" id="output-options">
            <option value="month" selected> kWh / Month</option>
            <option value="day"> kWh / Day</option>
            <option value="year"> MWh / Year</option>
          </select>
        </div>
        <input type="range" min="1" max="4500" value="0" step = "1" id = "kwh-slider"/>
      </div>
      <div class  = 'array-details' id = "solar-array-details">
        <label className= 'big-font' id = "solar-array-label" for="solar-array-slider"> Enter solar array details: </label> 
        <input id = "solar-array-slider" type="range" min = '0' step = '1' value="0" max = '1454'/>
        <p className="big-font" id = "solar-array-panels"> 0 </p>
      </div>
      <div id = "battery-system-details">
        <div className= 'array-details' id = "battery-array-details">
          <label className= 'big-font' id = "battery-array-label" for="battery-array-slider"> Fortress Battery system details: </label> 
          <input id = "battery-array-slider" type="range" min = '0' step = '1' value="0" max = '20'/>
          <p className="big-font" id = "battery-array-panels" style={display:'inline-block'}> 0 </p>
        </div>
      </div>
      <button type="button" id = "solar-api" ispressed = 'false' >Get System Data </button>
      <div id = 'system-results'>
        <p id = 'gen-days' className= "big-font"> </p>
        <p id = 'self-reliance' className= "big-font"> </p>
        <p id = 'percent-offset' className= 'big-font'> </p>
        <p id = 'solar-production' className= "big-font"> </p>
        <p id = 'solar-consumption' className= "big-font"> </p>
      </div>
      <div id="recalc-wrapper"> 
        <p id="monthly-consumption-text" className="angle" style={margin: '0'}> Change monthly consumption values: </p>
        <button type="button" id="recalc-table"> Recalculate </button>
      </div>
      <div id = "monthly-results">
        <table className="tg">
          <thead>
            <tr>
              <th className="tg-ujgf">Month</th>
              <th className="tg-ubgt">Solar Energy Production<br/>(kWh)</th>
              <th className="tg-ubgt">Total Consumption<br/>(kWh) <i id='consumption-icon' className="fa-solid fa-circle-info"></i> </th>
              <th className="tg-ubgt">Solar Consumption<br/>(kWh)</th>
              <th className="tg-ubgt">Grid Consumption<br/>(kWh)</th>
              <th className="tg-ubgt">Grid Sellback<br/>(kWh)</th>
              <th className="tg-ujgf">Days of Gen Use</th>
            </tr>
          </thead>
          <tbody>
            <tr id='month-0'>
              <td className="tg-m3bo"><span style={fontWeight: 'bold'}>January</span></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-1'>
              <td className="tg-h1fx">February</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-2'>
              <td className="tg-2rcr">March</td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-3'>
              <td className="tg-h1fx">April</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-4'>
              <td className="tg-2rcr">May</td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-5'>
              <td className="tg-h1fx">June</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-6'>
              <td className="tg-2rcr">July</td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-7'>
              <td className="tg-h1fx">August</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-8'>
              <td className="tg-2rcr">September</td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-9'>
              <td className="tg-h1fx">October</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-10'>
              <td className="tg-2rcr">November</td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc consumption"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
              <td className="tg-jerc"></td>
            </tr>
            <tr id='month-11'>
              <td className="tg-h1fx">December</td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6 consumption"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
              <td className="tg-huh6"></td>
            </tr>
            <tr id='month-all'>
              <td className="tg-ujgf">Total</td>
              <td className="tg-c6of"></td>
              <td className="tg-c6of"></td>
              <td className="tg-c6of"></td>
              <td className="tg-c6of"></td>
              <td className="tg-c6of"></td>
              <td className="tg-c6of"></td>
            </tr>
          </tbody>
          </table>
      </div>
    </div>
</div>   */


