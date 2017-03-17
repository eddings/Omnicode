'''

# Compute the mean of the smallest 25% values
- In this problem, you will compute the mean of the smallest 25% values in an array of numbers.
'''

def meanOfSmallest25P(nums):
    """
    The mean of the smallest 25% values

    Find the mean of the smallest 25% values in the given array, nums

    For example, the smallest 25% values of [1,2,3,4] is 1, and therefore, the mean is also 1.

    If there are identical values, you need to count them separately; i.e., the smallest 25% values of [1,1,1,3,5,7,8,9] consists of [1, 1]. Hence, its mean is 1.

    If the length of nums is not divisible by 4, use the 25% of the length value that is closest to the 25% of the length of the array but not greater.

    Ex. The 25% length of [1,1,3,4,5] is 1 since 25% of 5 is 1.25 and the closest integer that is not greater than 1.25 is 1. 

    Assume that the array contains at least four numbers.

    ------
    >>> print meanOfSmallest25P([1,1,1,1])
    1
    >>> print meanOfSmallest25P([1,1,3,2])
    1
    >>> print meanOfSmallest25P([3,1,2,1])
    1
    >>> print meanOfSmallest25P([1,3,3,2,1])
    1
    >>> print meanOfSmallest25P([7,1,2,3,4,5,6,8,9])
    1.5
    >>> print meanOfSmallest25P([6,-3,-1,3,-2,5,7,9,-5])
    -4
    """
    pass
