function spaceParser (input) {
  var spaceRegEx = (/^\s+/)
  if (spaceRegEx.test(input)) return [null, input.replace(spaceRegEx, '')]
  return null
}

function numberParser (input) {
  var numRegEx = (/^[-+]?(\d+(\.\d*)?|\.\d+)/)
  var num = numRegEx.exec(input)
  if (!num) return null
  var node = { type: 'Literal', value: parseFloat(num[0], 10), raw: num[0] }
  return [node, input.replace(num[0], '')]
}

function identifierParser (input) {
  var idRegEx = (/^\w+/)
  var word = idRegEx.exec(input)
  if (!word || (/^\d/.test(word))) return null
  var node = { type: 'Identifier', name: word.toString() }
  return [node, input.replace(word, '')]
}

function stringParser (input) {
  if (input.charAt(0) !== '"') return null
  var str = input.substring(1, input.lastIndexOf('"'))
  var node = { type: 'StringLiteral', value: str }
  str = '"' + str + '"'
  return [node, input.replace(str, '')]
}

function keywordParser (input) {
  var kwRegEx = (/^\w+|^[*+-<>%\/]/)
  var word = kwRegEx.exec(input)
  if (!word || !~keywords.indexOf(word[0])) return null
  if (word[0] === 'define') return declaratorParser(input)
  if (word[0] === 'lambda') return lambdaParser(input)
  if (word[0] === 'if') return ifParser(input)
  if (!!~arithmeticOperators.indexOf(word[0])) return arithmeticParser(input)
  if (!!~unaryOperations.indexOf(word[0])) return unaryParser(input)
}

function declaratorParser (input) {
  input = input.replace('define', '')
  var expr = seParser(input)
  if (!expr) return null
  var node = { 'type': 'VariableDeclarator', 'id': expr[0][0], 'init': expr[0][1] }
  return [node, expr[1]]
}

function lambdaParser (input) {
  input = input.replace('lambda', '')
  var expr = seParser(input)
  if (!expr) return null
  var body = expr[0][0][expr[0][0].length - 1]
  expr[0][0].splice(-1, 1)
  var node = { 'type': 'ArrowFunctionExpression', 'id':null, 'params': expr[0][0], 'body': body }
  return [node, expr[1]]
}

function arithmeticParser (input) {
  var operator = input.split(' ').shift()
  input = input.replace(operator, '')
  var expr = seParser(input)
  if (!expr) return null
  if (expr[0].length < 3) var node = binaryParser(expr[0], operator)
  else var node = reduceArr(expr[0], operator)
  return [node, expr[1]]
}

function binaryParser (input, word) {
  var node = { 'type': 'BinaryExpression', 'operator': word, 'left': input[0], 'right': input[1] }
  return node
}

function unaryParser (input) {
  var operator = (/^\w+/).exec(input).toString()
  input = input.replace(operator, '')
  var expr = seParser(input)
  if (!expr) return null
  var node = { 'type': 'Expression', 'operator': operator, 'arg': expr[0] }
  return [node, expr[1]]
}

function reduceArr (input, word) {
  var node = { "type": "ExpressionStatement",
  "expression": { "type": "CallExpression",
  "callee": { "type": "MemberExpression", "computed": false,
  "object": { "type": "Identifier", "name": 'input' },
  "property": { "type": "Identifier", "name": "reduce" }},
  "arguments": [{ "type": "ArrowFunctionExpression", "id": null,
  "params": [{ "type": "Identifier", "name": "x" },
  { "type": "Identifier", "name": "y" }],
  "body": { "type": "BinaryExpression", "operator": word,
  "left": { "type": "Identifier", "name": "x" },
  "right": { "type": "Identifier", "name": "y" }}}]}}
  return node
}

function ifParser (input) {
  input = input.replace('if', '')
  var expr = seParser(input)
  var node = { 'type':'IfStatement', 'test':expr[0][0][0] , ',consequent': expr[0][0][1][0], 'alternate': expr[0][0][1][1] }
  return [node, expr[1]]
}

function atomParser (input) {
  var selectedParser = parserSelector(keywordParser, identifierParser, numberParser, stringParser, expressionParser)
  var out = selectedParser(input)
  if (out) return out
  return null
}

function expressionParser (input) {
  if (input.charAt(0) !== '(') return null
  var arr = []
  var expr = slicer(input)
  input = expr[0]
  var out = seParser(input)
  var ast = out[0]
  for (nodes in ast) arr.push(ast[nodes])
  if (expr[1]) {
    input = expr[1]
    var ast = seParser(input)[0]
    for (nodes in ast) arr.push(ast[nodes])
  }
  return [arr, out[1]]
}

function seParser (input) {
  var arr = []
  while (input.length > 0) {
    var subExpr = atomParser(input)
    input = subExpr[1].toString()
    if (subExpr[0]) arr.push(subExpr[0])
    else break
  }
  return [arr, input]
}

function parserSelector (...parsers) {
  return function (string) {
    if (spaceParser(string)) string = spaceParser(string)[1]
    for (var parser of parsers) {
      var preParse = parser(string)
      if (preParse) return preParse
    }
    return null
  }
}

function slicer (input) {
  var openingParen = 1
  var i = 1
  while (i < input.length) {
    if (input.charAt(i) === '(') openingParen++
    if (input.charAt(i) === ')') openingParen--
    if (openingParen === 0) return [input.slice(1, i), input.substr(i + 1)]
    i++
  }
  return input.slice(1, i) + ' ' + input.substr(i + 1)
}

var keywords = ['define', 'lambda', '*', '+', '-', '/', '<', '>', '<=', '>=', '%', 'if',
'length', 'abs', 'append', 'pow', 'min', 'max', 'round', 'not', 'quote']
var unaryOperations = ['length', 'abs', 'round', 'not']
var arithmeticOperators = ['*', '+', '-', '/', '%', '<', '>', '<=', '>=', 'pow', 'append']

const readline = require('readline')
const rl =  readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
rl.on('line', (input) => {

  input = input.trim()
  if (input === 'exit') rl.close()
  var ast = { 'type': 'Program', 'body': [], 'script': 'LISP' }
  try { var solution = expressionParser(input)[0] }
  catch (err) { if (input !== 'exit') console.log('Incorrect Syntax Mate', err) }
  ast.body = solution
  if (solution !== undefined && input !== 'exit') console.log(JSON.stringify(ast, null, 2))
})
