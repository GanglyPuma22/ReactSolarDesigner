// var express = require('express'),
//     request = require('request'),
//     bodyParser = require('body-parser'),
//     app = express();

// var myLimit = typeof(process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
// console.log('Using limit: ', myLimit);

// app.use(bodyParser.json({limit: myLimit}));

// app.all('*', function (req, res, next) {

//     // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
//     res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));

//     if (req.method === 'OPTIONS') {
//         // CORS Preflight
//         res.send();
//     } else {
//         var targetURL = req.header('Target-URL'); // Target-URL ie. https://example.com or http://example.com
//         if (!targetURL) {
//             res.send(500, { error: 'There is no Target-Endpoint header in the request' });
//             return;
//         }
//         request({ url: targetURL + req.url, method: req.method, json: req.body, headers: {'Authorization': req.header('Authorization')} },
//             function (error, response, body) {
//                 if (error) {
//                     console.error('error: ' + response.statusCode)
//                 }
// //                console.log(body);
//             }).pipe(res);
//     }
// });

// app.set('port', process.env.PORT || 3000);

// app.listen(app.get('port'), function () {
//     console.log('Proxy server listening on port ' + app.get('port'));
// });

// function fetchLessAPI() {
//     let redirect = "http://localhost:5500"
//     //https://fortresspower.github.io/SystemDesigner/
//     let access_root_url = "https://accounts.zoho.com/oauth/v2/auth?"
//     let access_parameters = "response_type=code&client_id=" + clientID + "&scope=ZohoSheet.dataAPI.UPDATE&redirect_uri=" + redirect;

//     var xhr = new XMLHttpRequest();
//     xhr.open("GET", access_root_url+access_parameters, true);
//     xhr.onload = function (e) {
//     if (xhr.readyState === 4) {
//         if (xhr.status === 200) {
//         console.log(xhr.responseText);
//         var response = JSON.parse(xhr.responseText);
//         console.log(response);
//         } else {
//         console.error(xhr.statusText);
//         }
//     }
//     };
//     xhr.onerror = function (e) {
//     console.error(xhr.statusText);
//     };
//     xhr.send(null);
// }

//ZOHO Developer Params
let clientSecret = "0b9faca77c8ea1da044aeccf65b8b5e35aa24f6bb7";
let clientID = "1000.66ZJE80XRS53IW3LFX84LJNMFOR20T";
//let corsURL = "https://serene-shore-36760.herokuapp.com/";

let refreshToken;
let accessToken;

let webhookURL = "https://flow.zoho.com/769365077/flow/webhook/incoming?zapikey=1001.843a4803ace6d7283630509dd933de14.7b44faf89503b13024b0911a5ea0cbdf&isdebug=false";
//let webhookURL = "https://flow.zoho.com/769365077/flow/webhook/incoming?zapikey=1001.3d9ba142e3d6ee2caf0689dfe62ddae3.76a231b84cc28c9a6c29a9063aed597b&isdebug=true";
export function sendZohoWebhook() {
    let batteryType = document.getElementById('battery-options').value;
    let batteryQuantity = document.getElementById('battery-quantity').value;
    let inverterSize = document.getElementById('inverter-options').value;
    let inverterQuantity = document.getElementById('inverter-quantity').value;
    let additionalInverterCapacity = document.getElementById('inp-additional-capacity').value;
    let email = "john@smith.com";
    let phoneNumber = "1234";
    let firstName = "john";
    let lastName = "smith";
    console.log(batteryQuantity);

    try {
        fetch(webhookURL + "&firstName=" + firstName + "&lastName=" +  lastName + "&email=" + email + "&phoneNumber=" + phoneNumber + "&batteryType=" + batteryType +
        "&batteryQuantity=" + batteryQuantity + "&inverterQuantity=" + inverterQuantity + "&additionalInverter=" + additionalInverterCapacity 
        + "&inverterSize=" +  inverterSize);
    } catch(e) {
        console.log(e);
    }
}

//Function gets zoho auth code after asking for user consent
export function getAuthorization() {
    
    let redirect = "http://localhost:5500"
    //TODO Change redirect when live
    //let redirect = "https://fortresspower.github.io/SystemDesigner/";
    let access_root_url = "https://accounts.zoho.com/oauth/v2/auth?"
    let access_parameters = "response_type=code&client_id=" + clientID + "&scope=ZohoSheet.dataAPI.UPDATE&redirect_uri=" + redirect + "&access_type=offline&prompt=consent";
    window.location = access_root_url + access_parameters;
}

export function getAccessToken() {
    console.log(new URLSearchParams(window.location.search).get('code'));
    let code = new URLSearchParams(window.location.search).get('code');
    let corsURL = "https://serene-shore-36760.herokuapp.com/";
    let root_url = " https://accounts.zoho.com/oauth/v2/token?";
    let redirect = "http://localhost:5500";

    //https://fortresspower.github.io/SystemDesigner/
    let parameters = "code=" + code + "&client_id" + clientID + "&client_secret" + clientSecret + "&grant_type=authorization_code&redirect_uri=" + redirect;

    // let xhr = new XMLHttpRequest();
    // xhr.open("POST",corsURL + root_url + parameters);

    // xhr.setRequestHeader("Accept", "application/json");
    // xhr.setRequestHeader("Content-Type", "text/plain");

    // xhr.onload = () => console.log(xhr.responseText);

    // let data = `{
    // }`;

    // xhr.send(data);
    fetch(root_url + parameters, {
        method: 'POST',
        headers: {
        'Access-Control-Allow-Origin' : '*',
        'Access-Control-Allow-Methods' : 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '3600'
        }
    }).then(response => {
    response.json();
    }).then(data => {
    console.log(data);
    });

    // try {
    //     fetch(corsURL + root_url + parameters)
    //     // , {
    //     //     method: 'POST',
    //     //     mode: 'no-cors',
    //     //     headers: {
    //     //         'Content-Type': 'application/json',
    //     //     }
    //     // })
    //     .then(response => {
    //         console.log(response);
    //         response.json();
    //     })
    //     .then(data => {
    //         console.log('Success:', data);
    //         //refreshToken = data.refresh_token;
    //         accessToken = data.access_token;
    //     })
    // } catch(e) {
    //     console.log(e);
    // }
}