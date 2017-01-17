

def factorial(n):
    import math
    if not n >= 0:
        raise ValueError("n must be >= 0")
    if math.floor(n) != n:
        raise ValueError("n must be exact integer")
    if n+1 == n:  # catch a value like 1e300
        raise OverflowError("n too large")
    result = 1
    factor = 2
    while factor <= n:
        result *= factor
        factor += 1
    return result


# helper function written by student, not part of the lab
def add(x, y):
    return x + y


def slow_multiply(a, b):

    i = 0
    prod = 0
    for i in range(b):
        prod = add(prod, a)
    return prod


GLOBAL_DATA = [{"name": "John",  "age": 21},
               {"name": "Jane",  "age": 35},
               {"name": "Carol", "age": 18}]

def find_age(person):
    for e in GLOBAL_DATA:
        if e["name"] == person:
            return e["age"]
    raise KeyError # not found!