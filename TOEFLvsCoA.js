'use strict'; // you can ignore this

// keep conext and regressionConstants in global scope
let context = "";
let regressionConstants = "";

let canvas = document.getElementById('myCanvas');
context = canvas.getContext("2d");
fetch("admission_predict.json")
  .then(res => res.json()) // res is returned from the above fetch
  .then(data => makeScatterPlot(data)); // data is returned from last .then


// make a scater plot of the data with the given function
// this is the "main" function
// all other functions are called from here after data is loaded
function makeScatterPlot(data) {
  drawAxesLines();
  let axesLimits = findMinMax(data);
  drawAxesTicks(axesLimits);

  // for the first 400 data points, plot the point on the canvas
  for (let i = 0; i < data.length; i++) {
    plotCanvasPoint(data[i]);
  }

  // calculate regression constants and draw the regression line
  drawRegressionLine();

}

// draw x and y axes
function drawAxesLines() {
  line(50, 50, 50, 450);
  line(50, 450, 850, 450);
}

// find the min and max for each axis
// returns an object with x and y axes min/max
function findMinMax(data) {
  let TOEFLScores = data.map((row) => parseInt(row["TOEFL Score"]));
  let admissionRates = data.map((row) => parseFloat(row["Chance of Admit"]));
  regressionConstants = linearRegression(TOEFLScores, admissionRates);

  // get x-axis min and max
  let xMax = Math.max.apply(Math, TOEFLScores);
  let xMin = Math.min.apply(Math, TOEFLScores);

  // round x-axis limits
  xMax = Math.round(xMax*10)/10;
  xMin = Math.round(xMin*10)/10;

  // get y-axis min and max
  let yMax = Math.max.apply(Math, admissionRates);
  let yMin = Math.min.apply(Math, admissionRates);

  // round y-axis limits to nearest 0.05
  yMax = Number((Math.ceil(yMax*20)/20).toFixed(2));
  yMin = Number((Math.ceil(yMin*20)/20).toFixed(2));

  // format axes limits and return it
  let allMaxsAndMins = {
    xMax : xMax,
    xMin : xMin,
    yMax : yMax,
    yMin : yMin
  }
  return allMaxsAndMins;

}

// draw the axes ticks on both axes
function drawAxesTicks(axesLimits) {

  // draw x-axis ticks
  let xMark = axesLimits.xMin; // start a counter with initial value xMin
  for (let x = 75; x < 850; x += 25) {
    // stop if counter is greater than x-axis max
    if (xMark > axesLimits.xMax) {
      break;
    }
    // draw the counter and label it
    line(x, 440, x, 460);
    context.fillText(xMark, x-5, 470);
    // increment counter
    xMark += 1;
  }

  let yMark = axesLimits.yMin; // start a counter with initial value yMin
  for (let y = 400; y > 50; y -= 50) {
    yMark = Math.round(yMark*10)/10; // round counter to nearest hundredth
    // stop if counter is greater than y-axis max
    if (yMark > axesLimits.yMax) {
      break;
    }
    // draw the counter and label it
    line(40, y, 60, y);
    context.fillText(yMark, 15, y + 5);
    // increment counter
    yMark += 0.1;
  }
  context.fillText("TOEFL Score", 450, 500);
  context.fillText("Chance of Admit", 10, axesLimits.yMax+30);

}

// plot a point at the given Canvas x and y coordinate
function plotPoint(x, y) {
  context.beginPath();
  //context.arc(x, y, 5, 0, 2 * Math.PI, false); old arc
  context.arc(x, y, 3, 0, 2 * Math.PI, false); // made point area smaller
  //context.fillStyle = 'green'; old fill fillStyle
  context.fillStyle = '#4286f4'; // changed color to blue
  context.fill();
  //context.lineWidth = 5; old lineWidth
  context.lineWidth = 1; // made line width smaller
  context.strokeStyle = '#003300';
  context.stroke();
}

// draw a line starting from x1,y1 to x2,y2
function line(x1, y1, x2, y2) {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

// plot a json data point on the canvas
function plotCanvasPoint(point) {
  let canvasPoint = toCanvasPoint(point); // scale data point to canvas point
  plotPoint(canvasPoint.x, canvasPoint.y);
}

// convert a data point to canvas coordinates
function toCanvasPoint(point) {
  const xCanvas = (point["TOEFL Score"] - 91)*25 + 50; // scale the x point
  const yCanvas = 450 - (point["Chance of Admit"] - 0.3)*500; // scale the y point
  // return new x and y
  return {
    x: xCanvas,
    y: yCanvas
  }
}

// return a new point with Chance of Admit using Linear Regression Equation
function regressionLine(TOEFLScore) {
  return {
    // calculate Chance of Admit
    "Chance of Admit": Math.round((TOEFLScore*regressionConstants.a + regressionConstants.b)*100)/100,
    "TOEFL Score": TOEFLScore
  }
}

// Draw the regression line
function drawRegressionLine() {
  let startPoint = regressionLine(91); // Use 290 as line start point
  let endPoint = regressionLine(121); // Use 340 as line end point

  // convert points to Canvas points
  startPoint = toCanvasPoint(startPoint);
  endPoint = toCanvasPoint(endPoint);

  // draw regression line
  line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
}

/*********************************************************
                      Regression Functions
*********************************************************/
/*
 * You don't need to know the details of the functions below
 * the only thing you need to know is the linearRegression functions takes
 * as parameters two arrays and returns an object with two fields
 *
 * independent -> array of data that is your x-axis data
 * dependent -> array of data that is your y-axis data
 *
 * @return lr {Object} -> this object has two fields: a and b
 * these fields fit into the equation for a linear trendline
 * y = ax + b
**/
function linearRegression(independent, dependent)
{
    let lr = {};

    let independent_mean = arithmeticMean(independent);
    let dependent_mean = arithmeticMean(dependent);
    let products_mean = meanOfProducts(independent, dependent);
    let independent_variance = variance(independent);

    lr.a = (products_mean - (independent_mean * dependent_mean) ) / independent_variance;

    lr.b = dependent_mean - (lr.a * independent_mean);

    return lr;
}


function arithmeticMean(data)
{
    let total = 0;

    // note that incrementing total is done within the for loop
    for(let i = 0, l = data.length; i < l; total += data[i], i++);

    return total / data.length;
}


function meanOfProducts(data1, data2)
{
    let total = 0;

    // note that incrementing total is done within the for loop
    for(let i = 0, l = data1.length; i < l; total += (data1[i] * data2[i]), i++);

    return total / data1.length;
}


function variance(data)
{
    let squares = [];

    for(let i = 0, l = data.length; i < l; i++)
    {
        squares[i] = Math.pow(data[i], 2);
    }

    let mean_of_squares = arithmeticMean(squares);
    let mean = arithmeticMean(data);
    let square_of_mean = Math.pow(mean, 2);
    let variance = mean_of_squares - square_of_mean;

    return variance;
}
