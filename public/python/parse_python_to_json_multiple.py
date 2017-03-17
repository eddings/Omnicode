'''

Parses a Python source file into an AST in JSON format. can be viewed
online in a viewer like: http://jsonviewer.stack.hu/

Usage:

python parse_python_to_json.py --pyfile=test.py      # pass in code within a file
python parse_python_to_json.py ['print "Hello world"'] # pass in code in an array

python parse_python_to_json.py --pyfile=parse_python_to_json.py


Output: prints JSON to stdout

Modified on 2017-03-13 by Hyeonsu Kang
'''

import ast
import json
import optparse
#import pprint
import pythonparser # based on https://github.com/m-labs/pythonparser
import os
import sys

#pp = pprint.PrettyPrinter()

class Visitor:
    def visit(self, obj, level=0):
        """Visit a node or a list of nodes. Other values are ignored"""
        if isinstance(obj, list):
            return [self.visit(elt, level) for elt in obj]

        elif isinstance(obj, pythonparser.ast.AST):
            typ = obj.__class__.__name__
            #print >> sys.stderr, obj
            loc = None
            if hasattr(obj, 'loc'):
                loc = {
                    'start': {'line': obj.loc.begin().line(), 'column': obj.loc.begin().column()},
                    'end':   {'line': obj.loc.end().line(),   'column': obj.loc.end().column()}
                }
            # TODO: check out obj._locs for more details later if needed

            d = {}
            d['type'] = typ
            d['loc'] = loc
            d['_fields'] = obj._fields
            for field_name in obj._fields:
                val = self.visit(getattr(obj, field_name), level+1)
                d[field_name] = val
            return d

        else:
            # let's hope this is a primitive type that's JSON-encodable!
            return obj

def parse(flag, codeArray, indent_level):
    try:
        if flag == 1:
            # only one item
            p = pythonparser.parse(codeArray[0])
            v = Visitor()
            res = v.visit(p)
            print json.dumps(res, indent=indent_level)
        elif flag == 2:
            # multi-element
            res = [[] for x in range(len(codeArray))]
            for i, ary in enumerate(codeArray):
                res[i] = [[] for y in range(len(ary))]
                for j, code in enumerate(ary):
                    p = pythonparser.parse(code)
                    v = Visitor()
                    res[i][j] = v.visit(p)
            print json.dumps(res, indent=indent_level)

    except pythonparser.diagnostic.Error as e:
        error_obj = {'type': 'parse_error'}
        diag = e.diagnostic
        loc = diag.location

        error_obj['loc'] = {
                    'start': {'line': loc.begin().line(), 'column': loc.begin().column()},
                    'end':   {'line': loc.end().line(),   'column': loc.end().column()}
        }

        error_obj['message'] = diag.message()
        print json.dumps(error_obj, indent=indent_level)
        sys.exit(1)
 
def appendNewlineChar(codeArray):
    for i, ary in enumerate(codeArray):
        for j, c in enumerate(ary):
            if c[-1] != '\n':
                codeArray[i][j] = c + '\n'

if __name__ == "__main__":
    parser = optparse.OptionParser()
    parser.add_option("--pyfile", action="store", dest="pyfile",
                      help="Take input from a Python source file")
    parser.add_option("--pp", action="store_true",
                      help="Pretty-print JSON for human viewing")
    (options, args) = parser.parse_args()

    indent_level = None
    if options.pp:
        indent_level = 2

    if options.pyfile:
        codeArray = [open(options.pyfile).read()]
        parse(1, codeArray, indent_level)
    else:
        codeArray = json.loads(args[0])
        # make sure it ends with a newline to get parse() to work:
        appendNewlineChar(codeArray)
        parse(2, codeArray, indent_level)