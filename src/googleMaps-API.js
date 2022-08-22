import {runPVWattsAPI} from './pvWatts-API.js';
import {showResult} from './index.js';

//Geocoding API Key
let api_key = "AIzaSyDT6IVOnSgeDfRGE75fFo2LBMm7vrnkVEI"

const zipCodeInp = document.getElementById("zip-code");
const billInp = document.getElementById("monthly-bill");

//Function calls the google geocoder api which turns an address into lat and long coordinates
// export function runGeoAPI(monthlyConsumption, tilt, azimuth, size) {
//     if (zipCodeInp.value.length != 0 && billInp.value.length != 0) {
//         let address = zipCodeInp.value.replaceAll(' ', '+').replaceAll(',', '+').replaceAll('++', '+');
//         console.log(address);
//         let geo_root_url = "https://maps.googleapis.com/maps/api/geocode/json?"
//         let geo_parameters = "key=" + api_key + "&address=" + address;
//         console.log(geo_root_url + geo_parameters);
//         try {
//             fetch(geo_root_url + geo_parameters)
//             .then(response => response.json())
//             .then(data => {
//                 if (size === undefined) {
//                     handleGeoResult(data, monthlyConsumption);
//                 } else {
//                     return handleGeoResult(data, monthlyConsumption, tilt, azimuth, size);
//                 }
//             }
//             );
//         } catch(e) {
//             console.log(e);
//         }
//     } else {
//         console.log("Input missing for API call")
//     } 
    
// }

export function runGeoAPI(zipInput){
    console.log(document.getElementById('zip-code'));
    if (zipInput.length != 0) {
        let address = zipInput.replaceAll(' ', '+').replaceAll(',', '+').replaceAll('++', '+');
            console.log(address);
            let geo_root_url = "https://maps.googleapis.com/maps/api/geocode/json?"
            let geo_parameters = "key=" + api_key + "&address=" + address;
            console.log(geo_root_url + geo_parameters);

        return fetch(geo_root_url + geo_parameters)
        .then((response) => response.json())
        .then((responseData) => {
        return responseData.results[0].geometry.location;
        })
        .catch(error => console.warn(error));
    }
  }
  
//Function takes the lat and long results from the geocoder api and runs PV Watts with those values
function handleGeoResult(res, monthlyConsumption, tilt, azimuth, size) {
    console.log(res.results[0].geometry.location);
    let location = res.results[0].geometry.location;
    return runPVWattsAPI(showResult, location, monthlyConsumption, tilt, azimuth, size);
}