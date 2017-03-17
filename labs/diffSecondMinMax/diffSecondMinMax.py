'''

# Compupte the difference between second minimum and second maximum values
- In this problem, you will compute the difference between the second minimum and second maximum values of an array of numbers.

- Click on *Checkpoint 1* to see the problem description and its test cases.

'''

def diffSecondMinMax(nums):
    """
    Difference between the second minimum and second maxmimum values

    Find the difference bewteen the second minimum and second maximum values of the given array, nums

    For example, the second minimum value of [1,2,3] is 2, and the second maximum value of [1,2,3] is also 2, hence the difference between the two is 2 - 2 = 0.

    If there are identical values, you need to count them separately; i.e., the second minimum value of [1,1,3] is 1 and the second maximum value of [9,8,9] is 9.

    Compute the difference such that its value is always positive, i.e. absolute difference.

    Assume that the array contains at least two numbers.

    ------
    >>> print diffSecondMinMax([1,3])
    2
    >>> print diffSecondMinMax([1,3,2])
    0
    >>> print diffSecondMinMax([7,3,1,5,6])
    3
    >>> print diffSecondMinMax([7,3,1,6,7,8,9,1,3,3,3,2])
    7
    """
    pass
