#!/usr/bin/python

import sys
import pythonparser
from pythonparser import source, algorithm

def main():
	if len(sys.argv[1:]) is not 1:
		return

	ast = pythonparser.parse(sys.argv[1] + '\n')
	print ast

if __name__ == "__main__":
	main()