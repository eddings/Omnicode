'''

# Some small programming problems

- Difference between mean and median of numbers
- Minimum scalar product
- Maximum profit
- Sum square difference
- Largest palindrome product
- Fibonacci

'''


def meanMedianDiff(nums):
    """
    Mean, median value difference

    Find the difference bewteen mean and median values of the given array, nums

    For example, the mean of [1,2,3] is 2, and the median of [1,2,3] is also 2, hence the difference between the two is 2 - 2 = 0
    ------

    >>> print meanMedianDiff([1,2,3])
    0
    """
    pass


def minimumScalarProduct(x, y):
    """
    Minimum Scalar Product

    You are given two vectors x=(x1,x2,...,xn) and y=(y1,y2,...,yn) in number arrays.
    The scalar product of these vectors is a single number, calculated as x1*y1+x2*y2+...+xn*yn.
    Suppose you are allowed to permute the coordinates of each vector as you wish.
    Choose two permutations such that the scalar product of your two new vectors is the smallest possible,
    and output that minimum scalar product.
    ------

    >>> print minimumScalarProduct([1,-1,3], [2,1,4])
    1
    """
    pass



def maximumProfit(prices):
    """
    Maximum Profit

    Given the array of a stock's price starting from day 0,
    return the maximum value that you could get from buying and selling a stock within those days.
   
    ------

    >>> print maximumProfit([1,3,2,4,2,5,7,9,3,10,2,1])
    9
    """
    pass

def fibonacci(n):
    """
    Fibonacci

    Given an index (starting from 0), create a function that returns the corresponding fibonacci sequence number.

    For example,
    - fibonacci(0) returns 1,
    - fibonacci(1) returns 1,
    - fibonacci(2) returns 2,
    - fibonacci(3) returns 3,
    - fibonacci(4) returns 5
    and so on.

    ------

    >>> print fibonacci(0)
    1
    >>> print fibonacci(1)
    1
    >>> print fibonacci(2)
    2
    >>> print fibonacci(3)
    3
    >>> print fibonacci(4)
    5
    >>> print fibonacci(5)
    8
    >>> print fibonacci(6)
    13
    >>> print fibonacci(7)
    21
    >>> print fibonacci(8)
    34
    >>> print fibonacci(9)
    55
    >>> print fibonacci(10)
    89
    """
    pass

def sqrt(n):
    """
    Square Root without using the sqrt function
    
    Find the squareroot of a given number rounded down to the nearest integer, without using the sqrt function.
    For example, squareroot of a number between [9, 15] should return 3, and [16, 24] should be 4.

    ------

    >>> print sqrt(10)
    3
    >>> print sqrt(14)
    3
    >>> print sqrt(27)
    5
    >>> print sqrt(1)
    1
    >>> print sqrt(100)
    10
    >>> print sqrt(1000)
    31
    """
    pass

def sumSquareDiff(n):
    """
    Sum Square Difference

    The sum of the squares of the first ten natural numbers is,
    1^2 + 2^2 + ... + 10^2 = 385

    The square of the sum of the first ten natural numbers is,
    (1 + 2 + ... + 10)^2 = 55^2 = 3025

    Hence the difference between the sum of the squares of the first ten natural numbers and the square of the sum is 
    3025 - 385 = 2640

    Find the difference between the sum of the squares of the natural numbers less than or equal to n and the square of the sum.    
    ------

    >>> print sumSquareDiff(6)
    350
    """
    pass
    
def largestPalindromeProduct3():
    """
    Largest Palindrome Product for two 3-digit numbers

    A palindromic number reads the same both ways. The largest palindrome made from the product of two 2-digit numbers is 9009 = 91 x 99.
    
    Find the largest palindrome made from the product of two 3-digit numbers.
    ------

    >>> print largestPalindromeProduct3()
    0
    """
    pass
