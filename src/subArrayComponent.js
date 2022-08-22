import React from 'react';
import {decrementSubArrayCount} from './App.js'
import { FaTrash } from 'react-icons/fa';
import { useRef, useState, useEffect} from 'react';

// export function removeSubArray(num) {
//   document.getElementById('array'+ num.toString() + '-wrapper').style.display = 'none';
//   document.getElementById('hr'+ num.toString()).style.display = 'none';
//   //Clear inputs
//   document.getElementById('inp-size-array'+ num.toString()).value = '';
//   document.getElementById('inp-angle-array'+ num.toString()).value = '';
//   document.getElementById('inp-orientation-array'+ num.toString()).value = '';
//   decrementSubArrayCount();
//   //changeSubArrayMargin(0);
// }

export function SubArray(props) {
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
    {/* <FaTrash className = 'remove-subarray' id={'remove-subarray' + props.number} onClick = {() => {removeSubArray(props.number);}}/> */}
  </div>
  ;
}