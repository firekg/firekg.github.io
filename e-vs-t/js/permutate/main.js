define(function(require, exports, module) {
  // exports = 
  module.exports = {
      next:function next(arr,compareFunction) {
          var retArr = arr.slice();
          safeCompare = compareFunction || function(a,b) {
              if(a < b) {
                  return -1;
              } else if(a > b) {
                  return 1;
              }
              return 0;
          };
          for(var k = arr.length - 2; k > -1; k--) {
              if(arr[k] < arr[k+1]){
                  for(var l = arr.length - 1; l > k; l--) {
                      if( safeCompare(arr[k], arr[l]) < 0 ) {
                          retArr[k] = arr[l];
                          retArr[l] = arr[k];
                          var sub = retArr.slice(k+1);
                          sub.reverse();
                          retArr = retArr.slice(0,k+1).concat(sub);
                          return retArr;
                      }
                  }
              }
          }
          return null;
      },
      first:function first(arr,compareFunction) {
          var ret = arr.slice();
          ret.sort(compareFunction);
          return ret;
      },
      last:function last(arr,compareFunction) {
          var ret = this.first(arr,compareFunction);
          return ret.reverse();
      }
  };
});
