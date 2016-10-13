function spaceParser (input) {
  var spaceRegEx = (/^\s+/)
  if (spaceRegEx.test(input[1])) return [input[0], input[1].replace(spaceRegEx, '')]
  return null
}

function numberParser (input) {
  var numRegEx = (/^[-+]?(\d+(\.\d*)?|\.\d+)/)
  var num = numRegEx.exec(input[1])
  if (num) {
    var node = {
      type: 'Literal',
      value: parseFloat(num[0], 10),
      raw: num[0]
    }
    return [node, input[1].replace(num[0], '')]
  }
  return null
}

function identifierParser (input) {
  var idRegEx = (/^\w+/)
  var word = idRegEx.exec(input[1])
  if (word && !(/^\d/.test(word))) {
    var node = {
      type: 'Identifier',
      name: word.toString()
    }
    return [node, input[1].replace(word, '')]
  }
  return null
}

function keywordParser (input) {
  var kwRegEx = (/^\w+|^[*+-<>%\/]/)
  var word = kwRegEx.exec(input[1])
  if (word && !!~keywords.indexOf(word[0])) {
    if (word[0] === 'define') input = declaratorParser(input)
    if (word[0] === 'lambda') input = lambdaParser(input)
    if (!!~operators.indexOf(word[0])) input = operatorParser(input)
    return input
  }
  return null
}

function declaratorParser (input) {
  input[1] = input[1].replace('define', '')
  var expr = expressionParser(input)
  var node = {
    'type': 'Declaration',
    'id': expr[0][0],
    'init': expr[0][1]
  }
  return [node, expr[1]]
}

function lambdaParser (input) {
  input[1] = input[1].replace('lambda', '')
  var expr = expressionParser(input)
  console.log('lambda',expr)
  var node = {
    'args': expr[0][0],
    'expression': expr[0][1]
  }
  return [node, expr[1]]
}

function operatorParser (input) {
  var operator = input[1].charAt(0)
  input[1] = input[1].replace(operator, '')
  var expr = expressionParser(input)
  var node = {
    'type': 'Binary Expression',
    'operator': operator,
    'left': expr[0][0],
    'right': expr[0][1]
  }
  return [node, expr[1]]
}

function subExpressionParser (input) {
  var preParse
  preParse = bracketParser(input)
  if (preParse) input = preParse
  preParse = spaceParser(input)
  if (preParse) input = preParse
  preParse = keywordParser(input)
  if (preParse) return preParse
  preParse = identifierParser(input)
  if (preParse) return preParse
  preParse = numberParser(input)
  if (preParse) return preParse
  preParse = expressionParser(input)
  if (preParse) return preParse
  return null
}

function expressionParser (input) {
  if (typeof input === 'string') input = ['', input]
  var arr = []
  while (input[1].length > 0) {
    console.log('inp', input[1])
    var subExpr = subExpressionParser(input)
    console.log('postprocess', subExpr[0], subExpr[1])
    input = [subExpr[0], subExpr[1].toString()]
    if (subExpr[0]) { arr.push(subExpr[0]); console.log('array', arr) }
    else break
  }
  return [arr, input[1]]
}

function bracketParser (input) {
  if (input[1].charAt(0) === '(') {
    expr = slicer(input[1])
    if (expr[1] !== '') input[1] = expr[0] + ' ' + expr[1]
    else input[1] = expr[0]
    return input
  }
  return null
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

var keywords = ['define', 'lambda', '*', '+', '-', '/', '<', '>', '%']
var operators = ['*', '+', '-', '/', '<', '>', '%']

const readline = require('readline')
const rl =  readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

rl.on('line', (input) => {
	input = input.trim()
  if (input === 'exit') rl.close()
  var ast = {
    'type': 'Program',
    'body': [],
    'script': 'LISP'
  }
	try { var solution = expressionParser(input)[0] }
  catch (err) { console.log('Incorrect Syntax Mate', err) }
  ast.body = solution
	if (solution !== undefined && input !== 'exit') console.log(JSON.stringify(ast, null, 2))
})
