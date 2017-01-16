
def lesser_than(thelist,value):
    """Returns:  number of elements in thelist strictly less than value
    
    Example:  lesser_than([5, 9, 1, 7], 6) evaluates to 2
    
    Parameter thelist: the list to check (WHICH SHOULD NOT BE MODIFIED)
    Precondition: thelist is a list of ints
    
    Parameter value:  the value to compare to the list
    Precondition:  value is an int"""
    pass # Implement me
'''
    @test: {
        "name": "lesser_than",
        "case": [{
            "input": [[5, 9, 5, 7, 3, 10, 4], 5],
            "output": [2]
        }, {
            "input": [[5, 9, 5, 7, 3, 10, 4], 4],
            "output": [1]
        }, {
            "input": [[5, 9, 5, 7, 3, 10, 4], 3],
            "output": [0]
        }, {
            "input": [[5, 9, 5, 7, 3, 10, 4], 6],
            "output": [4]
        }, {
            "input": [[5, 9, 5, 7, 3, 10, 4], 10],
            "output": [6]
        }, {
            "input": [[5, 9, 5, 7, 3, 10, 4], 20],
            "output": [7]
        }]
    }
'''

def uniques(thelist):
    """Returns: The number of unique elements in the list. 
    
    Example: unique([5, 9, 5, 7]) evaluates to 3
    Example: unique([5, 5, 1, 'a', 5, 'a']) evaluates to 3
    
    Parameter thelist: the list to check (WHICH SHOULD NOT BE MODIFIED)
    Precondition: thelist is a list."""
    pass # Implement me
'''
    @test: {
        "name": "uniques",
        "case": [{
            "input": [[5, 9, 5, 7]],
            "output": [3]
        }, {
            "input": [[5, 5, 1, "a", 5, "a"]],
            "output": [3]
        }, {
            "input": [[1, 2, 3, 4, 5]],
            "output": [5]
        }, {
            "input": [[]],
            "output": [0]
        }]
    }
'''

def clamp(thelist,min,max):
    """Modifies the list so that every element is between min and max.
    
    Any number in the list less than min is replaced with min.  Any number
    in the list greater than max is replaced with max. Any number between
    min and max is left unchanged.
    
    This is a PROCEDURE. It modified thelist, but does not return a new list.
    
    Example: if thelist is [-1, 1, 3, 5], then clamp(thelist,0,4) changes
    thelist to have [0,1,3,4] as its contents.
    
    Parameter thelist: the list to modify
    Precondition: thelist is a list of numbers (float or int)
    
    Parameter min: the minimum value for the list
    Precondition: min <= max is a number
    
    Parameter max: the maximum value for the list
    Precondition: max >= min is a number"""
    pass # Implement me
'''
    @test: {
        "name": "clamp",
        "case": [{
            "input": [[-1, 1, 3, 5], 0, 4],
            "output": [[0,1,3,4]]
        }, {
            "input": [[1, 3], 0, 4],
            "output": [[1,3]]       
        }, {
            "input": [[-1, 1, 3, 5], 1, 1],
            "output": [[1, 1, 1, 1]]
        }, {
            "input": [[], 0, 4],
            "output": [[]]
        }]
    }
'''