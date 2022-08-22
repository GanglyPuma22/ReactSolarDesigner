//Make sure sendEMail function reachable in index.html
window.sendEMail = sendEMail;

//Regex for email validation
const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

//Function creates email body and opens link that encodes the information to send it
function sendEMail() {
    if (validateEmail(document.getElementById('email-input').value)) { //Check for valid email
        let emailInp = document.getElementById('email-input');
        var currentdate = new Date(); 

        let minutesText = currentdate.getMinutes();
        let secondsText = currentdate.getSeconds();
        if (minutesText.toString().length == 1) { //Make sure minutes has zero in front if length is 1
            minutesText = '0' + minutesText;
        }   
        if (secondsText.toString().length == 1) { //Make sure seconds has zero in front if length is 1
            secondsText = '0' + secondsText;
        }   

        //Convert Date and Time into String
        var datetime = '(' + currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/" 
                    + currentdate.getFullYear() + " "  
                    + currentdate.getHours() + ":"  
                    + minutesText + ":" 
                    + secondsText + ')';

        //Set up all text to put into email
        var zipCode = 'Zip Code: ' + document.getElementById('zip-code').value + '\n';
        var inverterInfo = 'Inverter Size: ' + document.getElementById('inverter-options').value + ' kW, Inverter Quantity: ' + document.getElementById('inverter-quantity').value + '\n';
        var batteryInfo = 'Fortress Battery System: ' + document.getElementById('battery-quantity').value + ' ' + document.getElementById('battery-options').value + 's';
        var dataText = '\n' + document.getElementById('system-results').innerText;
    
        var link = "mailto:" + emailInp.value 
                 + "?cc=referral@fortresspower.com"
                 + "&subject=" + encodeURIComponent("Fortress System Report " + datetime ) //Put date in email subject
                 + "&body=" + encodeURIComponent(zipCode + '\n' + inverterInfo + '\n' + batteryInfo + '\n' +  dataText);

        //Open created link which triggers email sending
        window.location.href = link;
    } else {
        alert("Invalid Email Address");
    }
}
