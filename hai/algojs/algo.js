// dependecies: simple_statistics, underscore, numeric

// ###############
// MyMath
// ###############
var MyMath = ( function( window, undefined ) {

  function MyMath() {

    // undescore already has a flatten
    this.flattenNestedArr = function flattenNestedArr(arrArr) {
      outArr = [];
      for (var i=0; i<arrArr.length; i++) {
        arr = arrArr[i];
        for (var j=0; j<arr.length; j++ ) {
          outArr.push(arr[j]);
        }
      }
      return outArr;
    };

    this.firstMax = function firstMax(vec) {
      var ind = 0;
      var val = -Infinity;
      for (var i=0; i<vec.length; i++) {
        if (vec[i] > val) {
          val = vec[i];
          ind = i;
        }
      }
      return [ind, val];
    };

    this.firstMin = function firstMin(vec) {
      var ind = 0;
      var val = Infinity;
      for (var i=0; i<vec.length; i++) {
        if (vec[i] < val) {
          val = vec[i];
          ind = i;
        }
      }
      return [ind, val];
    };

    this.vecMinusNumber = function vecMinusConst(vec, number) {
      var newVec = [];
      for (var i=0; i<vec.length; i++) {
        newVec.push(vec[i] - number);
      };
      return newVec;
    };
    this.absVec = function absVec(vec) {
      var newVec = [];
      for (var i=0; i<vec.length; i++) {
        newVec.push(Math.abs(vec[i]));
      };
      return newVec;
    };

    this.meanMatCol = function meanMatCol(mat) {
      var nrow, ncol, colVec, colMean;
      nrow = mat.length;
      ncol = mat[0].length;
      colMean = [];
      for (var icol=0; icol<ncol; icol++) {
        colVec = [];
        for (var irow=0; irow<nrow; irow++) {
          colVec.push(mat[irow][icol]);
        }
        colMean.push(ss.mean(colVec));
      }
      return colMean;
    };

    this.stdMatCol = function stdMatCol(mat) {
      var nrow, ncol, colVec, colStd;
      nrow = mat.length;
      ncol = mat[0].length;
      colStd = [];
      for (var icol=0; icol<ncol; icol++) {
        colVec = [];
        for (var irow=0; irow<nrow; irow++) {
          colVec.push(mat[irow][icol]);
        }
        colStd.push(ss.standardDeviation(colVec));
      }
      return colStd;
    };

    this.copyMat = function copyMat(mat) {
      var newMat = [];
      for (var i=0; i<mat.length; i++)
          newMat[i] = mat[i].slice();
      return newMat;
    };

    this.minusMatCol = function minusMatCol(mat, colVec) {
      var nrow, ncol, newMat;
      nrow = mat.length;
      ncol = mat[0].length;
      newMat = this.copyMat(mat);
      for (var icol=0; icol<ncol; icol++) {
        for (var irow=0; irow<nrow; irow++) {
          newMat[irow][icol] = mat[irow][icol] - colVec[icol];
        }
      }
      return newMat;
    };

    this.divideMatCol = function minusMatCol(mat, colVec) {
      var nrow, ncol, newMat;
      nrow = mat.length;
      ncol = mat[0].length;
      newMat = this.copyMat(mat);
      for (var icol=0; icol<ncol; icol++) {
        for (var irow=0; irow<nrow; irow++) {
          newMat[irow][icol] = mat[irow][icol]/colVec[icol];
        }
      }
      return newMat;
    };

    this.standardizeMatCol = function standardizeMatCol(mat) {
      var standardizedMat;
      colMean = this.meanMatCol(mat);
      colStd = this.stdMatCol(mat);
      return this.divideMatCol(this.minusMatCol(mat, colMean), colStd);
    };

  }
  return MyMath;
} )( window );


// ###############
// MyLogit
// ###############
var MyLogit = ( function( window, undefined ) {

  var myMath = new MyMath;

  function MyLogit() {

    this.softmax = function softmax(z) {
      return 1/(1 + Math.exp(-z));
    };

    this.softmaxZ = function softmaxZ(coefs, x2d) {
      return coefs[0] + coefs[1]*x2d[0] + coefs[2]*x2d[1];
    };

    this.probY = function probY(coefs, x2dData) {
      var x, z, probYgivenX;
      probYgivenX = [];
      for (var i=0; i<x2dData.length; i++) {
        x = x2dData[i];
        z = this.softmaxZ(coefs, x);
        probYgivenX[i] = this.softmax(z);
      };
      return probYgivenX;
    };

    this.predictY = function predictY(coefs, x2dData) {
      var probY = this.probY(coefs, x2dData);
      var predY = [];
      for (var i=0; i<probY.length; i++) {
        predY[i] = Math.round(probY[i]);
      };
      return predY;
    };

    this.highestProb = function highestProb(coefs, x2dCandidates) {
      // var xShuffle = _.shuffle(x2dCandidates);
      var probY = this.probY(coefs, x2dCandidates);
      var indValMax = myMath.firstMax(probY);
      return [x2dCandidates[indValMax[0]], indValMax];
    };

    this.mostUncertain = function mostUncertain(coefs, x2dCandidates) {
      // var xShuffle = _.shuffle(x2dCandidates);
      var probY = this.probY(coefs, x2dCandidates);
      var certainty = numeric.abs(numeric.sub(probY, 0.5));
      var indValMin = myMath.firstMin(certainty);
      return [x2dCandidates[indValMin[0]], indValMin];
    };

    this.deltaCoefs = function deltaCoefs(coefs, x2d, y1d) {
      var z, factor;
      z = this.softmaxZ(coefs, x2d);
      factor = y1d - this.softmax(z);
      return [factor, factor*x2d[0], factor*x2d[1]];
    };

    this.updateCoefs = function updateCoefs(coefs, dcoefs, lr) {
      var newCoefs = [];
      for (var i=0; i<coefs.length; i++) {
        newCoefs.push(coefs[i] + lr*dcoefs[i]);
      }
      return newCoefs;
    };

    this.updateCoefsData = function updateCoefsData(initCoefs, x2dData, y1dData, lr) {
      var coefs, dcoefs;
      coefs = initCoefs;
      for (var i=0; i<x2dData.length; i++) {
        dcoefs = this.deltaCoefs(coefs, x2dData[i], y1dData[i]);
        coefs = this.updateCoefs(coefs, dcoefs, lr);
      };
      return coefs;
    };

    this.logLikelihood = function logLikelihood(coefs, x2dData, y1dData) {
      var x, y, z, h;
      var logLik = [];
      for (var i=0; i<x2dData.length; i++) {
        x = x2dData[i];
        y = y1dData[i];
        z = this.softmaxZ(coefs, x);
        h = this.softmax(z);
        // logLik[i] = y*Math.log(h) + (1 - y)*Math.log(1 - h); //not robust
        if (y == 0) {
          logLik[i] = Math.log(1 - h);
        } else {
          logLik[i] = Math.log(h);
        };
      };
      return ss.sum(logLik);
    };

    this.train = function train(initCoefs, x2dData, y1dData, lr, maxIter) {
      var eps = Math.pow(10, -3);
      var coefs, updatedCoefs, logLikCoefs, logLikUpdatedCoefs;
      coefs = initCoefs;
      for (var i=0; i<maxIter; i++) {
        updatedCoefs = this.updateCoefsData(coefs, x2dData, y1dData, lr);
        logLikCoefs = this.logLikelihood(coefs, x2dData, y1dData);
        logLikUpdatedCoefs = this.logLikelihood(updatedCoefs, x2dData, y1dData);
        if (Math.abs(logLikCoefs - logLikUpdatedCoefs) < eps) {
          return updatedCoefs;
        }
        coefs = updatedCoefs;
        // console.log(logLikCoefs);
      };
      // console.log("MyLogit: Maximum iteration reached without convergence. \
                  // Delta log likelihood = ", logLikCoefs - logLikUpdatedCoefs);
      return updatedCoefs;
    };

    this.unstandardizeCoefs = function unstandardizeCoefs(coefs, meanVec, stdVec) {
      var unstandCoefs = [0,0,0];
      unstandCoefs[0] = coefs[0] - coefs[1]*meanVec[0]/stdVec[0] - coefs[2]*meanVec[1]/stdVec[1];
      unstandCoefs[1] = coefs[1]/stdVec[0];
      unstandCoefs[2] = coefs[2]/stdVec[1];
      return unstandCoefs;
    };

  }
  return MyLogit;
} )( window );


// ###############
// SampleStimulus
// ###############
var SampleStimulus = ( function( window, undefined ) {

  var spareRandom = null;

  function normalRandom(mean, std) {
  //Marsaglia polar method
  	var val, u, v, s, mul;
  	if(spareRandom !== null) {
  		val = spareRandom;
  		spareRandom = null;
  	}
  	else {
  		do {
  			u = Math.random()*2-1;
  			v = Math.random()*2-1;
  			s = u*u+v*v;
  		} while(s === 0 || s >= 1);

  		mul = Math.sqrt(-2 * Math.log(s) / s);
  		val = u * mul;
  		spareRandom = v * mul;
  	}
  	return mean + std*val;
  }

  function normalRandomInRange(mean, std, min, max) {
    var s;
    do {
      s = normalRandom(mean, std);
    } while (s<min || s>max);
    return s;
  }

  // public methods
  function SampleStimulus() {

    this.smallVar = function smallVar(min, max) {
      var mid, std;
      mid = (min + max)/2;
      std = Math.sqrt(75);
      return normalRandomInRange(mid, std, min, max);
    };

    this.bigVar = function bigVar(min, max) {
      var mid, std;
      mid = (min + max)/2;
      std = Math.sqrt(9000)/2; // radius (not diameter) & angle 0 to 180 (not 360)
      return normalRandomInRange(mid, std, min, max);
    };

  }
  return SampleStimulus;
} )( window );


// ###############
// SetStimulus
// ###############
var SetStimulus = ( function( window, undefined ) {

  function discretize(min, max, n) {
    var arr, dx;
    arr = [];
    dx = (max-min)/(n-1);
    for (var i=0; i<n; i++) {
      arr.push(min + i*dx);
    }
    return arr;
  };

  function broadcast(arr1, arr2) {
    var arr = [];
    for (var i=0; i<arr1.length; i++) {
      for (var j=0; j<arr2.length; j++) {
        arr.push([arr1[i], arr2[j]]);
      }
    }
    return arr;
  };

  function subarray(arr, indi, indf) {
    var subarr = [];
    for (var i=indi; i<=indf; i++) {
      subarr.push(arr[i]);
    }
    return subarr;
  };

  function SetStimulus(STI_AREA_W, STI_RADIUS_BASE, STI_ANGLE_BASE) {

    this.STI_MARGIN = 50; //px
    this.STI_SHIFT = 40; //px or deg
    this.STI_RADIUS_MIN = STI_RADIUS_BASE + this.STI_MARGIN; //px
    this.STI_RADIUS_MAX = STI_AREA_W/2 - this.STI_MARGIN; //px
    this.STI_ANGLE_MIN = STI_ANGLE_BASE; //deg
    this.STI_ANGLE_MAX = this.STI_ANGLE_MIN + 150; //deg

    this.randCond = function randCond() {
    // 2 sampling cond x 2 category cond = 4 conditions:
    // SA means small std on angle, large std on radius
    // SR means small std on radius, large std on angle
      var s_cond, c_cond;
      if (Math.random()>0.5) {
          s_cond = "SA";
      } else {
          s_cond = "SR";
      }
      if (Math.random()>0.5) {
          c_cond = "Beat";
      } else {
          c_cond = "Sonic";
      }
      return [s_cond, c_cond];
    };

    this.randClass = function randClass() {
      if (Math.random()>0.5){
        return "Beat";
      } else {
        return "Sonic";
      }
    };

    this.setTrials = function setTrials(max_trials, cond) {
      var sampSti = new SampleStimulus();
      var arr = {radius: [], angle: [], truth: []};
      var c, r, a, s;
      var min_r = this.STI_RADIUS_MIN;
      var max_r = this.STI_RADIUS_MAX;
      var min_a = this.STI_ANGLE_MIN;
      var max_a = this.STI_ANGLE_MAX;
      for (var i=0; i<max_trials; i++) {
        c = this.randClass();
        if (cond[0] == "SR" && cond[1] == "Beat") {
          s = sampSti.smallVar(min_r, max_r);
          a = sampSti.bigVar(min_a, max_a);
          if ( c == "Beat" ) {
            r = s - this.STI_SHIFT;
          } else if ( c == "Sonic") {
            r = s + this.STI_SHIFT;
          }
        } else if (cond[0] == "SR" && cond[1] == "Sonic") {
          s = sampSti.smallVar(min_r, max_r);
          a = sampSti.bigVar(min_a, max_a);
          if ( c == "Beat" ) {
            r = s + this.STI_SHIFT;
          } else if ( c == "Sonic") {
            r = s - this.STI_SHIFT;
          }
        } else if (cond[0] == "SA" && cond[1] == "Beat") {
          s = sampSti.smallVar(min_a, max_a);
          r = sampSti.bigVar(min_r - this.STI_MARGIN, max_r + this.STI_MARGIN);
          if ( c == "Beat" ) {
            a = s - this.STI_SHIFT;
          } else if ( c == "Sonic") {
            a = s + this.STI_SHIFT;
          }
        } else if (cond[0] == "SA" && cond[1] == "Sonic") {
          s = sampSti.smallVar(min_a, max_a);
          r = sampSti.bigVar(min_r - this.STI_MARGIN, max_r + this.STI_MARGIN);
          if ( c == "Beat" ) {
            a = s + this.STI_SHIFT;
          } else if ( c == "Sonic") {
            a = s - this.STI_SHIFT;
          }
        }
        arr.truth.push(c);
        arr.radius.push(r);
        arr.angle.push(a);
      };
      return arr;
    };

    this.decisionRule = function decisionRule(radius, angle, cond) {
      var radiusBoundary = (this.STI_RADIUS_MAX + this.STI_RADIUS_MIN)/2;
      var angleBoundary = (this.STI_ANGLE_MAX + this.STI_ANGLE_MIN)/2;
      var decision;
      if (cond[0] == "SR" && cond[1] == "Beat") {
        if ( radius <= radiusBoundary ) {
          decision = "Beat";
        } else {
          decision = "Sonic";
        };
      } else if (cond[0] == "SR" && cond[1] == "Sonic") {
        if ( radius <= radiusBoundary ) {
          decision = "Sonic";
        } else {
          decision = "Beat";
        };
      } else if (cond[0] == "SA" && cond[1] == "Beat") {
        if ( angle <= angleBoundary ) {
          decision = "Beat";
        } else {
          decision = "Sonic";
        }
      } else if (cond[0] == "SA" && cond[1] == "Sonic") {
        if ( angle <= angleBoundary ) {
          decision = "Sonic";
        } else {
          decision = "Beat";
        };
      };
      return decision;
    };

    this.setCheckTrials = function setCheckTrials(max_trials, cond) {
      var arr = {radius: [], angle: [], truth: []};
      var radiusMin = this.STI_MARGIN - this.STI_SHIFT;
      var radiusMax = STI_AREA_W/2 - this.STI_MARGIN + this.STI_SHIFT;
      var angleMin = 15;
      var angleMax = 180 - 15;
      var n = 16;
      var nSplit = 2;
      var nSub = n/nSplit;
      var nInBlock = max_trials/nSplit/nSplit;
      var radiusArr = discretize(radiusMin, radiusMax, n);
      var angleArr = discretize(angleMin, angleMax, n);
      var tempArr = [];
      var subRadiusArr, subAngleArr, mixArr;
      for (var rSplit=0; rSplit<nSplit; rSplit++) {
        for (var aSplit=0; aSplit<nSplit; aSplit++) {
          subRadiusArr = subarray(radiusArr, rSplit*nSub, (rSplit+1)*nSub-1);
          subAngleArr = subarray(angleArr, aSplit*nSub, (aSplit+1)*nSub-1);
          mixArr = broadcast(subRadiusArr, subAngleArr);
          mixArr = _.shuffle(mixArr);
          for (i=0; i<nInBlock; i++) {
            tempArr.push(mixArr[i]);
          }
        }
      }
      tempArr = _.shuffle(tempArr);
      for (var i=0; i<tempArr.length; i++) {
        var r = tempArr[i][0];
        var a = tempArr[i][1];
        var optLabel = this.decisionRule(r, a, cond);
        arr.truth.push(optLabel);
        arr.radius.push(r);
        arr.angle.push(a);
      };
      return arr;
    };

    this.addUnifNoise = function addUnifNoise(x2d, x1Level, x2Level) {
      var n = x2d.length;
      var newX2d = x2d;
      for (var i=0; i<n; i++) {
        newX2d[i][0] = x2d[i][0] + x1Level*(Math.random() - 0.5);
        newX2d[i][1] = x2d[i][1] + x2Level*(Math.random() - 0.5);
      }
      return newX2d;
    };

    this.setGridCandidates = function setGridCandidates() {
      var radiusMin = this.STI_MARGIN - this.STI_SHIFT;
      var radiusMax = STI_AREA_W/2 - this.STI_MARGIN + this.STI_SHIFT;
      var angleMin = 15;
      var angleMax = 180 - 15;
      var n = 16;
      var radiusArr = discretize(radiusMin, radiusMax, n);
      var angleArr = discretize(angleMin, angleMax, n);
      var candidates = broadcast(radiusArr, angleArr);
      var radiusNoise = (radiusMax - radiusMin)/(n - 1);
      var angleNoise = (angleMax - angleMin)/(n - 1);
      return this.addUnifNoise(candidates, radiusNoise, angleNoise);
    };

    this.reformatForMyLogit = function reformatForMyLogit (stiArr, preference) {
      var x = [];
      var y = [];
      var n = stiArr.truth.length;
      for (var i=0; i<n; i++) {
        x.push([stiArr.radius[i], stiArr.angle[i]]);
        if (stiArr.truth[i] == preference) {
          y.push(1);
        } else {
          y.push(0);
        };
      };
      return [x, y];
    };

  }
  return SetStimulus;
} )( window );


// ###############
// ModuleTemplate
// ###############
var ModuleTemplate = ( function( window, undefined ) {

  function ModuleTemplate() {

      this.myMethod = function myMethod() {

      };

  }
  return ModuleTemplate;
} )( window );
