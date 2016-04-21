permutate
===

NodeJS implementation of next permutation from lexicographic order of an array, a'la Narayana Pandita in 14th century India. 


Sample Usage
===

    var permutate = require('permutate');

    var seq = [1,2,3]; 
    while(seq) {
    	console.log(seq);
    	seq = permutate.next(seq);
    }

    /**********  outputs :


    [1, 2, 3]
    [1, 3, 2]
    [2, 1, 3]
    [2, 3, 1]
    [3, 1, 2]
    [3, 2, 1]

    **********/
