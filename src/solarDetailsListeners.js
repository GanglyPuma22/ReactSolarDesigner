const solarDetailsChbox = document.getElementById("solar-details");
const subArrayChbox = document.getElementById('sub-array-box');

//Show/Hide optional solar details when solar details checkbox value changes
solarDetailsChbox.addEventListener("change", function () {
    let currentMargin = parseInt(document.getElementById('inverter-battery').style.marginTop.replace('px',''));
    if (isNaN(currentMargin)) { 
        currentMargin = 0;
    }
    let marginVal = 50;

    if (solarDetailsChbox.checked) {
        document.getElementById('optional-details').style.display = 'inline-block';
        document.getElementById('inverter-battery').style.marginTop = currentMargin + marginVal + 'px';
        //document.getElementById('battery-details').style.marginTop = '140px';
        document.getElementById('sub-array').style.marginTop = marginVal + 'px';
        document.getElementById('module-fortress-system').style.marginTop = (currentMargin + marginVal).toString() + 'px';
        // document.getElementById('optional-details').style.maxHeight = 'fit-content';
    } else {
        document.getElementById('optional-details').style.display = 'none';
        document.getElementById('inverter-battery').style.marginTop = currentMargin - marginVal + 'px';
        //document.getElementById('battery-details').style.marginTop = '90px';
        document.getElementById('sub-array').style.marginTop = '0px';
        document.getElementById('module-fortress-system').style.marginTop = currentMargin - marginVal + 'px';
        // document.getElementById('optional-details').style.maxHeight = '0';
    }
})

//Show/Hide optional sub array details when sub array checkbox value changes
subArrayChbox.addEventListener("change", function () {
    let marginVal = 130;

    let currentMargin = parseInt(document.getElementById('inverter-battery').style.marginTop);
    if (isNaN(currentMargin)) { 
        currentMargin = 0;
    }

    console.log(currentMargin);
    if (subArrayChbox.checked) {
        document.getElementById('sub-array-details').style.display = 'flex';
        document.getElementById('inverter-battery').style.marginTop = (currentMargin + marginVal).toString() + 'px';
        document.getElementById('module-fortress-system').style.marginTop = (currentMargin + marginVal).toString() + 'px';
    } else {
        document.getElementById('sub-array-details').style.display = 'none';
        document.getElementById('inverter-battery').style.marginTop = currentMargin - marginVal + 'px';
        document.getElementById('module-fortress-system').style.marginTop = currentMargin - marginVal + 'px';
    }
})

//Add event listener to bound tilt input
document.getElementById('inp-tilt').addEventListener('change', function () {
    let el = document.getElementById('inp-tilt');
    if (el.value > 90) { el.value = 90;} 
    else if (el.value < 0) { el.value = 0;}
});

//Add event listener to bound azimuth input
document.getElementById('inp-azimuth').addEventListener('change', function () {
    let el = document.getElementById('inp-azimuth');
    if (el.value > 359) { el.value = 359;} 
    else if (el.value < 0) { el.value = 0; }
});

//Event listeners to bound sub array tilt and orientation
for (let i = 1; i < 4; i++) {
    document.getElementById('inp-angle-array' + i).addEventListener('change', function () {
        let el = document.getElementById('inp-angle-array' + i);
        if (el.value > 90) { el.value = 90;} 
        else if (el.value < 0) { el.value = 0; }
    });
    document.getElementById('inp-orientation-array' + i).addEventListener('change', function () {
        let el = document.getElementById('inp-orientation-array' + i);
        if (el.value > 359) { el.value = 359;} 
        else if (el.value < 0) { el.value = 0; }
    });
    
}

//Add event listener to bound derate input
document.getElementById('inp-derate').addEventListener('change', function () {
    let el = document.getElementById('inp-derate');
    if (el.value > 0.99) { el.value = 0.99;} 
    else if (el.value < -0.05) { el.value = -0.5; }
});

