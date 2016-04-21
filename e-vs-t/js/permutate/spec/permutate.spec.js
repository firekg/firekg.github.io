

var permutate = require('../permutate');

describe('has interface', function() {
    it('should have next+first+last methods', function() {
        expect(permutate.next).toBeDefined();
        expect(typeof permutate.next).toBe("function");

        expect(permutate.first).toBeDefined();
        expect(typeof permutate.first).toBe("function");

        expect(permutate.last).toBeDefined();
        expect(typeof permutate.last).toBe("function");
    });
});


describe('first method', function() {

    var firstArr = [0,1,2,3,4,5,6,7,8,9];
    var lastArr = firstArr.slice();
        lastArr.reverse();

    it("should return first permuation",function(){
        var pFirst = permutate.first(lastArr);
        expect(pFirst).toBeDefined();
        expect(Array.isArray(pFirst)).toBe(true);
        expect(pFirst.join()).toBe(firstArr.join());
    });
});

describe('last method', function() {
    var firstArr = [0,1,2,3,4,5,6,7,8,9];
    var lastArr = firstArr.slice();
        lastArr.reverse();

    it("should return last permuation",function(){
        var pLast = permutate.last(firstArr);
        expect(pLast).toBeDefined();
        expect(Array.isArray(pLast)).toBe(true);
        expect(pLast.join()).toBe(lastArr.join());
    });
});

describe('next method', function() {

    it("should return 6 permutations for 3 unique items in order",function() {
        var seq = [1,2,3];
        var count = 0;
        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        expect(count).toBe(6);
    });

    it("should return 24 permutations for 4 unique items in order",function() {
        var seq = [1,2,3,4];
        var count = 0;
        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        expect(count).toBe(24);
    });

    it("should return 24 permutations for 4 unique 'words' in order",function() {
        var seq = ['apple','button','corndog','dimple'];
        var count = 0;
        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        expect(count).toBe(24);
    });

    it("should return 6 permutations for 4 items in order when only 2 are unique",function() {
        var seq = [1,1,2,2];
        var count = 0;
        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        expect(count).toBe(6);
    });

    it("should return 362880 permutations for 9 items in order",function() {
        var seq = [0,1,2,3,4,5,6,7,8];
        var count = 0;
        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        expect(count).toBe(362880);
    });

    it("should return 3628800 permutations for 10 items in order",function() {
        
        var seq = [0,1,2,3,4,5,6,7,8,9];
        var count = 0;
        //var before = +new Date();

        while (seq != null){   
            count++;
            seq = permutate.next(seq);
        }
        //console.log(+new Date() - before);
        expect(count).toBe(3628800);
    });

    it("should use provided sortingFunction",function() {
        var obj = {
            sortFunk:function(a,b) {
                return a - b;
            }
        };
        spyOn(obj, 'sortFunk');
        permutate.next([0,1,2],obj.sortFunk);
        expect(obj.sortFunk).toHaveBeenCalled();
        expect(obj.sortFunk.calls.count()).toBe(3);
    });
})


