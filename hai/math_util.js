function sampleSamllVar(min, max) {
  var mid, std;
  mid = (min + max)/2;
  std = Math.sqrt(75);
  return normalRandomInRange(mid, std, min, max);
}

function sampleBigVar(min, max) {
  var mid, std;
  mid = (min + max)/2;
  std = 30;
  return normalRandomInRange(mid, std, min, max);
}

function normalRandomInRange(mean, std, min, max) {
  var s;
  do {
    s = normalRandom(mean, std)
  } while (s<min || s>max);
  return s
}

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
		} while(s == 0 || s >= 1);

		mul = Math.sqrt(-2 * Math.log(s) / s);
		val = u * mul;
		spareRandom = v * mul;
	}
	return mean + std*val
}

function mean(in_array) {
  var n, s;
  n = in_array.length;
  s = 0;
  for (i=0; i<n; i++) {
    s += in_array[i];
  }
  return s/n;
}

function std(in_array) {
  var n, s, m;
  n = in_array.length;
  s = 0;
  m = mean(in_array);
  for (i=0; i<n; i++) {
    s += (in_array[i]-m)*(in_array[i]-m);
  }
  return Math.sqrt(s/(n-1));
}
