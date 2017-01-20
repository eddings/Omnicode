#!/usr/bin/python

import sys
import pythonparser
from pythonparser import source, algorithm

def main():
	if len(sys.argv[1:]) is not 2:
		return

	ast1 = pythonparser.parse(sys.argv[1] + '\n')
	ast2 = pythonparser.parse(sys.argv[2] + '\n')
	print pythonparser.algorithm.compare(ast1, ast2)

if __name__ == "__main__":
	main()