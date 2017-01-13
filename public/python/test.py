import pythonparser
from pythonparser import source, algorithm

f1, f2 = 'src.py', 'src2.py'
with open(f1, 'r') as f1, open(f2, 'r') as f2:
	ast1 = pythonparser.parse(f1.read() + '\n', 'src.py')
	ast2 = pythonparser.parse(f2.read() + '\n', 'src2.py')
	print ast1
	print ast2
	print pythonparser.algorithm.compare(ast1, ast2)