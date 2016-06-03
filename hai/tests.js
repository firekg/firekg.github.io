var myMath = new MyMath;
eps = Math.pow(10, -6);


QUnit.test( "Numerics test", function( assert ) {
  var arr = [1,1,1,1];
  var quant = numeric.abs(numeric.sub(arr, 1));
  // console.log(quant);
  assert.ok( ss.sum(quant) == 0, "Passed." );
});


QUnit.test( "SetStimulus smoke test", function( assert ) {
    var setSti = new SetStimulus(300, 5, 15);
    var candidates = setSti.setCandidates();
    // console.log(myMath.flattenNestedArr(candidates));
    assert.ok( 1 == 1, "Passed." );

    var setSti = new SetStimulus(300, 10, 30);
    var nSamp = 10;
    var cond = setSti.randCond();
    var preference = setSti.randClass();
    var stiArr = setSti.setTrials(nSamp, cond);
    var xy = setSti.reformatForMyLogit(stiArr, preference);
    var x = xy[0];
    var y = xy[1];
    assert.ok( x.length == nSamp, "Passed x generation for MyLogit." );
    assert.ok( y.length == nSamp, "Passed x generation for MyLogit." );
});


QUnit.test( "MyMath MatCol operations test", function( assert ) {
  var x = [[6,148,72,35,0,33.6,0.627,5],
           [1.50,85,66.5,29,0,26.6,0.351,31],
           [8,183,64,0,0,23.3,0.672,32],
           [0.5,89,65.5,23,94,28.1,0.167,21],
           [0,137,40,35,168,43.1,2.288,33]];

  var xColMean = myMath.meanMatCol(x);
  var xShift = myMath.minusMatCol(x, xColMean);
  var xShiftColMean = myMath.meanMatCol(xShift);
  assert.ok( ss.sum(xShiftColMean) < eps, "Passed" );

  var xColStd = myMath.stdMatCol(x);
  assert.ok( ss.sum(xColStd) > eps, "Passed" );

  var standardMat = myMath.standardizeMatCol(x);
  var standaradMatColStd = myMath.stdMatCol(standardMat);
  assert.ok( ss.mean(standaradMatColStd) - 1 < eps, "Passed" );
});


QUnit.test( "SamplesStimulus smoke test", function( assert ) {
    var sampSti = new SampleStimulus;
    var n = 1000;

    var STI_RADIUS_MIN = 60;
    var STI_RADIUS_MAX = 250
    var STI_ANGLE_MIN = 15;
    var STI_ANGLE_MAX = 165;

    var small_var_array = [];
    var big_var_array = [];

    for (var i=0; i<n; i++) {
      small_var_array.push(sampSti.smallVar(STI_RADIUS_MIN, STI_RADIUS_MAX));
      big_var_array.push(sampSti.bigVar(STI_ANGLE_MIN, STI_ANGLE_MAX));
    }

    // console.log("Length array = %s", small_var_array.length);
    //
    // console.log("Mean radisu = %s|%s",
    //   ss.mean(small_var_array), (STI_RADIUS_MIN + STI_RADIUS_MAX)/2);
    //
    // console.log("Mean angle = %s|%s",
    //   ss.mean(big_var_array), (STI_ANGLE_MIN + STI_ANGLE_MAX)/2);
    //
    // console.log("Std small var = %s|%s",
    //   ss.standardDeviation(small_var_array), Math.sqrt(75));
    //
    // console.log("Std big var = %s|%s",
    //   ss.standardDeviation(big_var_array), 30);

    assert.ok( small_var_array.length == n, "Passed." );
});


QUnit.test( "MyLogit smoke test", function( assert ) {
  var x = [[125.5543400533685, 114.52346107930032],
           [135.95093168614616, 166.97863948048527],
           [118.40694847048746, 51.01093276319756],
           [49.99249687191234, 129.9242130899781],
           [38.261876321870915, 136.54800943568407],
           [52.8818721432029, 68.494778740155],
           [29.878761624447378, 106.96806359081016],
           [109.60060237281837, 82.11740044637678],
           [116.24416113965188, 124.13412946590572],
           [37.118372331845336, 98.31201384422008]];

  var y = [1, 1, 1, 0, 0, 0, 0, 1, 1, 0];

  var myLogit = new MyLogit;

  assert.ok(myLogit.softmax(0) - 0.5 < eps, "Passed midpoint");
  assert.ok(myLogit.softmax(1000) - 1 < eps, "Passed positive limit");
  assert.ok(myLogit.softmax(-1000) < eps, "Passed negative limit");

  var coefs, dcoefs, coefs1, coefs2;
  coefs = [0, 0, 0];
  for (var i=0; i<x.length; i++) {
    dcoefs = myLogit.deltaCoefs(coefs, x[i], y[i]);
    coefs1 = myLogit.updateCoefs(coefs, dcoefs, 0.1);
  };
  coefs2 = myLogit.updateCoefsData(coefs, x, y, 0.1);
  assert.ok( ss.sum(numeric.sub(coefs1, coefs2)) < eps, "Passed updateCoefsData" );

  var coefs, logLik;
  coefs = [0, 0, 0];
  coefs = myLogit.updateCoefsData(coefs, x, y, 0.1);
  logLik = myLogit.logLikelihood(coefs, x, y);
  assert.ok( logLik < 0, "Passed logLikelihood" );

  var initCoefs, finalCoefs, predY;
  initCoefs =[0, 0, 0];
  finalCoefs = myLogit.train(initCoefs, x, y, 0.1, 50);
  predY = myLogit.predictY(finalCoefs, x);
  var err = 0;
  for (var i=0; i<y.length; i++) {
    err += Math.abs(y[i] - predY[i]);
  };
  assert.ok( err < eps, "Passed train" );
});


QUnit.test( "MyLogit with SetStimulus test", function( assert ) {
  var setSti = new SetStimulus(300, 10, 30);
  var nSamp = 10;
  var cond = setSti.randCond();
  var preference = setSti.randClass();
  var stiArr = setSti.setTrials(nSamp, cond);
  var xy = setSti.reformatForMyLogit(stiArr, preference);
  var x = xy[0];
  var y = xy[1];
  // console.log("x = ", myMath.flattenNestedArr(x));
  // console.log("y = ", y);

  var standardX = myMath.standardizeMatCol(x);

  var myLogit = new MyLogit;

  var initCoefs, finalCoefs, predY;
  initCoefs =[0, 0, 0];
  finalCoefs = myLogit.train(initCoefs, standardX, y, 1, 100);
  predY = myLogit.predictY(finalCoefs, standardX);
  // console.log("Coefs = ", finalCoefs);
  // console.log("y = ", y);
  // console.log("predictions = ", predY);
  var err = 0;
  for (var i=0; i<y.length; i++) {
    err += Math.abs(y[i] - predY[i]);
  };
  assert.ok( err < eps, "Passed train" );
});


QUnit.test( "MyLogit highsestProb & mostUncertain selection test", function( assert ) {
  var setSti = new SetStimulus(300, 10, 30);
  var nSamp = 5;
  var cond = setSti.randCond();
  var preference = setSti.randClass();
  var stiArr = setSti.setTrials(nSamp, cond);
  var xy = setSti.reformatForMyLogit(stiArr, preference);
  var x = xy[0];
  var y = xy[1];

  var myLogit = new MyLogit;
  var candidates = setSti.setCandidates();

  var meanVec, stdVec, standardX, initCoefs, finalCoefs, predY;
  meanVec = myMath.meanMatCol(x);
  stdVec = myMath.stdMatCol(x);
  standardX = myMath.standardizeMatCol(x);
  initCoefs = [0, 0, 0];
  finalCoefs = myLogit.train(initCoefs, standardX, y, 1, 100);
  finalCoefs = myLogit.unstandardizeCoefs(finalCoefs, meanVec, stdVec);

  var probYOfCandidates = myLogit.probY(finalCoefs, candidates);

  var xProbMax, probMax_, probMax, indValMax;
  xProbMax = myLogit.highestProb(finalCoefs, candidates);
  indValMax = myMath.firstMax(probYOfCandidates);
  probMax_ = _.max(probYOfCandidates);
  probMax = myLogit.probY(finalCoefs, [xProbMax]);
  // console.log(indValMax);
  // console.log(xProbMax);
  // console.log(probMax_);
  // console.log(probMax);
  assert.ok( indValMax[1] == probMax_, "MyMath.firstMax passed." );
  assert.ok( probMax == probMax_, "MyLogit.highestProb Passed." );

  var xCertaintyMin, certainty, certaintyMin_, certaintyMin, indValMin;
  xCertaintyMin = myLogit.mostUncertain(finalCoefs, candidates);
  certainty = numeric.abs(numeric.sub(probYOfCandidates, 0.5));
  indValMin = myMath.firstMin(certainty);
  certaintyMin_ = _.min(certainty);
  certaintyMin = Math.abs(myLogit.probY(finalCoefs, [xCertaintyMin])[0] - 0.5);
  // console.log(indValMin);
  // console.log(xCertaintyMin);
  // console.log(certaintyMin_);
  // console.log(certaintyMin);
  assert.ok( indValMin[1] == certaintyMin_, "MyMath.firstMin passed." );
  assert.ok( certaintyMin == certaintyMin_, "MyLogit.mostUncertain Passed." );
});


QUnit.test( "MyLogit interaction test", function( assert ) {
  var setSti = new SetStimulus(300, 10, 30);
  var nSamp = 5;
  var cond = setSti.randCond();
  var preference = setSti.randClass();
  var stiArr = setSti.setTrials(nSamp, cond);
  var xy = setSti.reformatForMyLogit(stiArr, preference);
  var x = xy[0];
  var y = xy[1];

  var myLogit = new MyLogit;

  var initCoefs, finalCoefs, candiates, xChosen, optimalLabel;
  var meanVec, stdVec, standardX;
  var nIter = 10;
  for (var iIter=0; iIter<nIter; iIter++) {
    initCoefs =[0, 0, 0];
    meanVec = myMath.meanMatCol(x);
    stdVec = myMath.stdMatCol(x);
    standardX = myMath.standardizeMatCol(x);
    finalCoefs = myLogit.train(initCoefs, standardX, y, 1, 100);
    finalCoefs = myLogit.unstandardizeCoefs(finalCoefs, meanVec, stdVec);
    candidates = setSti.setCandidates();
    xChosen = myLogit.highestProb(finalCoefs, candidates);

    x.push(xChosen);
    optimalLabel = setSti.decisionRule(xChosen[0], xChosen[1], cond);
    if (optimalLabel == preference) {
      y.push(1);
    } else {
      y.push(0);
    };
  };

  assert.ok( 1 == 1, "Interaction runs Passed." );
});


// QUnit.test( "Naive Bayes online example", function( assert ) {
//   var trainingSet = [[6,148,72,35,0,33.6,0.627,5],
//                [1.50,85,66.5,29,0,26.6,0.351,31],
//                [8,183,64,0,0,23.3,0.672,32],
//                [0.5,89,65.5,23,94,28.1,0.167,21],
//                [0,137,40,35,168,43.1,2.288,33]];
//
//   var predictions = [1, 0, 1, 0, 1];
//
//   var dataset = [[6,148,72,35,0,33.6,0.627,5],
//                  [1.50,85,66.5,29,0,26.6,0.351,31]];
//
//   var nb = new ML.SL.NaiveBayes();
//   nb.train(trainingSet, predictions);
//   var ans = nb.predict(dataset);
//
//   var nbobj = nb.export();
//
//   // console.log("Result : ",ans);
//   // console.log("nb : ",nbobj);
//
//   assert.ok( 1 == "1", "No smoke!" );
// });
