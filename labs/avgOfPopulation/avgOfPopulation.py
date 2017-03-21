'''
# Who used the average amount of water among the entire population last month?
- In this problem, you will compute the amount of water usage of a person closest to the average of the entire population, given in a dictionary.
'''

def avgOfPopulation(pop_usage):
    """
    Who used the average amount of water among the entire population last month?

    Find the average that is the closest to that of the entire population, usage, given in a dictionary

    For example, in a population of 4 people {"TOM": 35, "SALLY": 27, "PHILIP": 28, "GIGI": 42}, the average water usage is 33 and therefore, the function should return TOM's 35, which is the closest to 33.

    If there is a tie, return the average of them; i.e., TOM and SALLY are both equally close to the average of the population, 22, in {"TOM": 21, "SALLY": 23, "PHILIP": 28, "GIGI": 16}, so instead of returning either of the two values (21 or 23) return its average, 22.
    ------
    >>> print avgOfPopulation({"TOM": 35, "SALLY": 27, "PHILIP": 28, "GIGI": 42})
    35
    >>> print avgOfPopulation({"TOM": 21, "SALLY": 23, "PHILIP": 28, "GIGI": 16})
    22
    >>> print avgOfPopulation({"TOM": 0, "SALLY": 23, "PHILIP": 28, "GIGI": 16, "ANGELA": 13, "PAUL": 33, "GAUDI": 20, "KANDARP": 17, "BRADY": 39})
    20
    >>> print avgOfPopulation({"TOM": 15})
    15
    >>> print avgOfPopulation({"TOM": 15, "OSLO": 14})
    14.5
    """
    pass
