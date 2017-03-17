#!/usr/bin/python

import sys
import re
import json

def main(argv):
	identifier = re.compile(r"^[^\d\W]\w*\Z", re.UNICODE)
	res = []
	for arg_exp in argv:
		j = json.loads(arg_exp)
		for e in j:
			result = re.match(identifier, e)
			if result is not None:
				res.append(e)
	print res

if __name__ == "__main__":
	main(sys.argv[1:])
