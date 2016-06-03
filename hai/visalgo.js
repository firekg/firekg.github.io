var myMath = new MyMath;
var myLogit = new MyLogit;
var setSti = new SetStimulus(300, 5, 15);

var FIG_W = 250;
var GRID_SIZE = 5;
var GRID_N = FIG_W/GRID_SIZE;
var COND = setSti.randCond();
var PREFERENCE = setSti.randClass();

var slide = $("<div id='slide'>");
slide.width(FIG_W).height(FIG_W);
// slide = $("<div id='slide' width=500 height=500>"); //this doesn't set up the right dimensions
slide.css('background','lightgray');

var axis = $("<canvas id='axis' width=" + FIG_W.toString() +
             " height=" + FIG_W.toString() + ">");
// axis = $("<canvas id='axis'>");
// axis.width(500).height(500); //distorts drawing if defined here after canvas intialization

var grid = gridCoord(GRID_N, FIG_W);
// console.log(myMath.flattenNestedArr(grid));

var whichData = "sampled";
var whichGridPrediction = "none";
var interactionFlag = true;
var candidatesFixFlag = true;

if (whichData == "fixed") {
var X_TRAIN = [[125.5543400533685, 114.52346107930032],
         [135.95093168614616, 166.97863948048527],
         [118.40694847048746, 51.01093276319756],
         [49.99249687191234, 129.9242130899781],
         [38.261876321870915, 136.54800943568407],
         [52.8818721432029, 68.494778740155],
         [29.878761624447378, 106.96806359081016],
         [109.60060237281837, 82.11740044637678],
         [116.24416113965188, 124.13412946590572],
         [37.118372331845336, 98.31201384422008]];
var Y_TRAIN = [1, 1, 1, 0, 0, 0, 0, 1, 1, 0];
// var coefs = [-0.18119025, 0.53268641, -0.42078255]; //from scikit's logreg
// var coefs = [-0.6502475244635024, 28.126744299321548, -21.855648428988907]; // from myLogit
// var coefs = [-100, 1, 0]; //play around: the real answer would look more like this
};

if (whichData = "sampled") {
  var nSamp = 1;
  var stiArr = setSti.setTrials(nSamp, COND);
  var data = setSti.reformatForMyLogit(stiArr, PREFERENCE);
  var X_TRAIN = data[0];
  var Y_TRAIN = data[1];
  // console.log("x = ", myMath.flattenNestedArr(X_TRAIN));
  // console.log("y = ", myMath.flattenNestedArr(Y_TRAIN));
};

if (interactionFlag == false) {
  var meanVec = myMath.meanMatCol(X_TRAIN);
  var stdVec = myMath.stdMatCol(X_TRAIN);
  var x = myMath.standardizeMatCol(X_TRAIN);
  var initCoefs, finalCoefs;
  initCoefs =[0, 0, 0];
  finalCoefs = myLogit.train(initCoefs, x, Y_TRAIN, 1, 100);
  finalCoefs = myLogit.unstandardizeCoefs(finalCoefs, meanVec, stdVec);
  // console.log(coefs);
};


if (interactionFlag == true) {
  if (candidatesFixFlag == true) {
    var N_CANDIDATES = 400;
    var CANDIDATES = setSti.setTrials(N_CANDIDATES, COND);
    var candidates = [];
    var n = CANDIDATES.radius.length;
    for(var i=0; i<n; i++) {
      candidates.push([CANDIDATES.radius[i], CANDIDATES.angle[i]]);
    };
    // console.log(_.sortBy(CANDIDATES.radius));
  } else {
    var candidates;
  };
  var initCoefs, finalCoefs, xChosen_indVal, optimalLabel;
  var meanVec, stdVec, standardX;
  var nIter = 9;
  for (var iIter=0; iIter<nIter; iIter++) {
    initCoefs =[0, 0, 0];
    meanVec = myMath.meanMatCol(X_TRAIN);
    stdVec = myMath.stdMatCol(X_TRAIN);
    standardX = myMath.standardizeMatCol(X_TRAIN);
    finalCoefs = myLogit.train(initCoefs, standardX, Y_TRAIN, 1, 100);
    finalCoefs = myLogit.unstandardizeCoefs(finalCoefs, meanVec, stdVec);
    if (candidatesFixFlag == false) {
      candidates = setSti.setGridCandidates();
    };
    // xChosen_indVal = myLogit.highestProb(finalCoefs, candidates);
    xChosen_indVal = myLogit.mostUncertain(finalCoefs, candidates); //has convergence problem
    if (candidatesFixFlag == true) {
      candidates.splice(xChosen_indVal[1][0], 1);
      // console.log("ind chosen:", xChosen_indVal[1][0]);
      // console.log("Length of candidates:", candidates.length);
      // console.log("[r, a] chosen:", [xChosen_indVal[0][0], xChosen_indVal[0][1]]);
    };
    X_TRAIN.push(xChosen_indVal[0]);
    optimalLabel = setSti.decisionRule(xChosen_indVal[0][0], xChosen_indVal[0][1], COND);
    if (optimalLabel == PREFERENCE) {
      Y_TRAIN.push(1);
    } else {
      Y_TRAIN.push(0);
    };
    console.log("Iteration ", iIter);
  };
};

if (whichGridPrediction == "MyLogit") {
  var candidates = setSti.setGridCandidates();
  var predictions = myLogit.predictY(coefs, candidates);
};

if (whichGridPrediction == "Optimal") {
  var optimalLabel;
  var optimalPredictions = [];
  for (var i=0; i<candidates.length; i++) {
    optimalLabel = setSti.decisionRule(candidates[i][0], candidates[i][1], COND);
    if (optimalLabel == PREFERENCE) {
      optimalPredictions[i] = 1;
    } else {
      optimalPredictions[i] = 0;
    };
  };
};

slide.append(axis);
$("body").append(slide);
$(document).ready(function(){
  paintSoftmax(grid, GRID_SIZE, finalCoefs);
  drawData(X_TRAIN, Y_TRAIN, 1);
  // drawData(candidates, predictions, 1);
  // drawData(candidates, optimalPredictions, 1);
});
$(".slide").hide();
slide.show();

console.log("Shown.");


//################
// functions
//################
function gridCoord(n, width) {
  var dx, shift, coord;
  dx = width/n;
  coord = [];
  for (var iy=0; iy<n; iy++) {
    for (var ix=0; ix<n; ix++) {
      coord.push([dx*ix, dx*iy]);
    }
  }
  return coord;
};

function fillAxis() {
  // console.log($("#axis").attr("width")); // could use this
  var c = document.getElementById("axis");
  var ctx = c.getContext("2d");
  ctx.beginPath();
  ctx.rect(50, 50, 400, 400);
  ctx.fillStyle = '#d3d3d3';
  ctx.fill();
}

function logRegPredict(xData, coefs) {
  var x, y, z, s;
  s = [];
  for (var i=0; i<xData.length; i++) {
    x = xData[i][0];
    y = xData[i][1];
    z = coefs[0] + coefs[1]*x + coefs[2]*y;
    s.push(myLogit.softmax(z))
  }
  return s;
};

function paintSoftmax(grid, gridWidth, coefs) {
  var c = document.getElementById("axis");
  var ctx = c.getContext("2d");
  var x, y, z, color, rgbaStr;
  var n = grid.length;
  for (var i=0; i<n; i++) {
    x = grid[i][0];
    y = grid[i][1];
    z = coefs[0] + coefs[1]*x + coefs[2]*y;
    color = Math.round(myLogit.softmax(z)*255);
    rgbaStr = "rgba(" + color.toString() + "," + color.toString() + "," + color.toString() + ",1)";
    ctx.beginPath();
    ctx.rect(x, y, gridWidth, gridWidth);
    ctx.fillStyle = rgbaStr;
    ctx.fill();
    // console.log(rgbaStr);
    // console.log(color);
    // console.log(grid[i][0], grid[i][1]);
  }
};

function drawData(x2d, y1d, scale) {
  var c = document.getElementById("axis");
  var ctx = c.getContext("2d");
  var n = y1d.length;
  for (var i=0; i<n; i++) {
    x1 = x2d[i][0]*scale;
    x2 = x2d[i][1]*scale;
    ctx.beginPath();
    ctx.arc(x1, x2, 2, 0, 2*Math.PI);
    if (y1d[i] == 1) {
      ctx.fillStyle = 'red';
    } else {
      ctx.fillStyle = 'blue';
    };
    ctx.fill();
    ctx.font = "15px Arial";
    ctx.fillText(i.toString(), x1, x2);
  };
};
