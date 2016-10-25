const keywords = ['const', '=>', '*', '+', '-', '/', '<', '>', '<=', '>=', '%', 'if',
'length', 'abs', 'append', 'pow', 'min', 'max', 'round', 'not', 'quote']
const unaryOperations = ['length', 'abs', 'round', 'not']
const arithmeticOperators = ['*', '+', '-', '/', '%', '<', '>', '<=', '>=', 'pow', 'append']
var ast = { 'type': 'Program', 'body': [], 'script': 'LISP' }
var variables = []
var consoleInput = []
var lambdaDecFlag = 0

function spaceParser (input) {
  return (/^\s+/).test(input) ? [null, input.replace(/\s+/, '')] : null
}

function numberParser (input) {
  var numRegEx = /^[-+]?(\d+(\.\d*)?|\.\d+)/
  return (num = numRegEx.exec(input))
         ? [{ type: 'Literal', value: parseFloat(num[0], 10), raw: num[0] }, input.replace(num[0], '')]
         : null
}
// matches words that do not match keywords
function identifierParser (input) {
  var idRegEx = /^[a-zA-Z]/
  if (!idRegEx.exec(input)) return null
  word = input.split(' ')[0]
  variables.push(word)
  input = input.replace(word, '')
  var node = { type: 'Identifier', name: word }
  var varDict = variables.indexOf(word)
  if (!!~varDict && variables[varDict + 1] === 'function') {
    var node = functionCaller (input, word)
    var input = node[1]
    node = node[0]
  }
  return [node, input]
}

function stringParser (input) {
  if (input.charAt(0) !== '"') return null
  var str = input.substring(1, input.lastIndexOf('"'))
  var node = { type: 'StringLiteral', value: str }
  str = '"' + str + '"'
  return [node, input.replace(str, '')]
}
// looks for matching pre-defined keywords
function keywordParser (input) {
  var kwRegEx = (/^[a-zA-Z]+|^[*+-<>%=\/]+/)
  var word = kwRegEx.exec(input)
  if (!word || !~keywords.indexOf(word[0])) return null
  var selectedParser = parserSelector(declaratorParser, lambdaParser, ifParser, arithmeticParser, unaryParser)
  return (out = selectedParser(input)) ? out : null
}
// declares variables with 'const'
function declaratorParser (input) {
  if (!input.startsWith('const')) return null
  input = input.replace('const', '')
  var expr = seParser(input)
  if (!expr) return null
  var node = { type: 'VariableDeclaration', declarations: [{
    type: 'VariableDeclarator', id: expr[0][0], init: expr[0][1] }], kind: 'const'}
  return [node, expr[1]]
}
// returns arrow function expressions
function lambdaParser (input) {
  if (!input.startsWith('=>')) return null
  input = input.replace('=>', '')
  variables.push('function')
  var expr = seParser(input)
  if (!expr) return null
  var body = expr[0][0][expr[0][0].length - 1]
  expr[0][0].splice(-1, 1)
  let count = 0
  for (keys in body) count++
  if (count > 4) {
    var node = { type: 'ArrowFunctionExpression', id: null, params: expr[0][0],
      body: { type: 'BlockStatement', body: [body] },
      generator: false, expression: true }
  } else {
    node = { type: 'ArrowFunctionExpression', id: null, params: expr[0][0],
    body: body, generator: false, expression: true }
  }
  return [node, expr[1]]
}

function lambdaIIFE (input) {
  input = input.replace('=>', '')
  var expr = seParser(input)
  console.log(expr[0][0][1][1])
  if (!expr) return null
  node = { type: 'ExpressionStatement', expression: {
            type: 'CallExpression', callee: {
              type: 'ArrowFunctionExpression', id: null, params: [expr[0][0][0]],
                body: expr[0][0][1][0], generator: false, expression: true },
                  arguments: [expr[0][0][1][1]]
              }
          }
  return [node, expr[1]]
}

function arithmeticParser (input) {
  if (!~arithmeticOperators.indexOf(input.split(' ')[0])) return null
  var operator = input.split(' ')[0]
  input = input.replace(operator, '')
  var expr = seParser(input)
  if (!expr) return null
  if (expr[0].length < 3) var node = binaryParser(expr[0], operator)
  else node = reduceArr(expr[0], operator)
  return [node, expr[1]]
}
// two argument operations
function binaryParser (input, word) {
  var node = { type: 'BinaryExpression', operator: word, left: input[0], right: input[1] }
  return node
}
// operations > 2 args; array reduce
function reduceArr (input, word) {
  var node = { type: 'ExpressionStatement',
    expression: { type: 'CallExpression',
      callee: { type: 'MemberExpression', computed: false,
      object: { type: 'ArrayExpression', elements: input },
      property: { type: 'Identifier', name: 'reduce' }},
    arguments: [{ type: 'ArrowFunctionExpression', id: null,
      params: [{ type: 'Identifier', name: 'x' },
      { type: 'Identifier', name: 'y' }],
    body: { type: 'BinaryExpression', operator: word,
    left: { type: 'Identifier', name: 'x' },
    right: { type: 'Identifier', name: 'y' }}}]}}
  return node
}

function unaryParser (input) {
  if (!~unaryOperations.indexOf(input.split(' ')[0])) return null
  var operator = (/^\w+/).exec(input).toString()
  input = input.replace(operator, '')
  var expr = seParser(input)
  if (!expr) return null
  var node = { type: 'Expression', operator: operator, arg: expr[0] }
  return [node, expr[1]]
}

function ifParser (input) {
  if (!input.startsWith('if')) return null
  input = input.replace('if', '')
  var expr = seParser(input)
  var node = { type: 'ExpressionStatement', expression:
    { type: 'ConditionalExpression', test: expr[0][0][0],
      consequent: expr[0][0][1][0], alternate: expr[0][0][1][1] }}
  return [node, expr[1]]
}

function functionCaller (input, word)  {
  expr = input ? seParser(input) : null
  if(expr) {
    input = expr[1]
    node = { type: 'ExpressionStatement', expression: {
              type: 'CallExpression', callee:
                { type: 'Identifier', name: word }, arguments: expr[0] }
           }
  }
  else node = { type: 'ExpressionStatement', expression: {
            type: 'CallExpression', callee:
              { type: 'Identifier', name: word }, arguments: ''}
              }
  return [node, '']
}
// selects and calls a single parser
function atomParser (input) {
  var selectedParser = parserSelector(keywordParser, identifierParser, numberParser, stringParser, expressionParser)
  var out = selectedParser(input)
  if (out) return out
  return null
}
// strips brackets, stores ast for multiple expressions, calls seParser
function expressionParser (input) {
  if (input.charAt(0) !== '(') return null
  var arr = []
  var openingParen = 1                                                          // strips brackets, returns elements inside
  var i = 1
  var flag = 0
  while (i < input.length) {
    if (input.charAt(i) === '(') openingParen++
    if (input.charAt(i) === ')') openingParen--
    if (openingParen === 0) {
      var expr = [input.slice(1, i), input.substr(i + 1)]
      flag = 1
      break
    }
    i++
  }
  if (flag === 0) expr = input.slice(1, i) + ' ' + input.substr(i + 1)
  input = expr[0]
  var out = atomParser(input)
  var ast = out[0]
  arr.push(ast)
  if (expr[1]) {
    input = expr[1]
    out = atomParser(input)
    ast = out[0]
    arr.push(ast)
    return [arr, out[1]]
  }
  return [arr.pop(), out[1]]
}
// calls atom parser and stores ast for single expression
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

function superExpressionParser (input) {
  input = input.slice(1, -1)
  if (input.charAt(0) === '(') {
    input = input.substr(1)
    if (spaceParser(input)) input = spaceParser(input)
    if (input.startsWith('=>')) {
    input = '(' + input
    var openingParen = 1                                                          // strips brackets, returns elements inside
    var i = 1
    var flag = 0
    while (i < input.length) {
      if (input.charAt(i) === '(') openingParen++
      if (input.charAt(i) === ')') openingParen--
      if (openingParen === 0) {
        var expr = [input.slice(1, i), input.substr(i + 1)]
        flag = 1
        break
      }
      i++
    }
    if (flag === 0) expr = input.slice(1, i) + ' ' + input.substr(i + 1)
    if(expr[1]) return lambdaIIFE(expr.join(' '))[0]
  }
  }
  let ast = atomParser(input)[0]
  return ast
}
// returns one parser that evaluates the next atom
var parserSelector = (...parsers) => function (input) {
  if (spaceParser(input)) input = spaceParser(input)[1]
  return parsers.reduce((acc, parser) => acc === null ? parser(input) : acc, null)
}

var escodegen = require('escodegen')
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
// repl
rl.on('line', (input) => {
  input = input.trim()
  if (input === 'exit') rl.close()
  try { var solution = superExpressionParser(input)[0] }
  catch (err) { if (input !== 'exit') console.log('Incorrect Syntax Mate', err) }
  if (input !== 'exit') {
    ast.body.push(solution)
  }
  else {
    var js = escodegen.generate(ast)
    while (!!~js.indexOf(';')) js = js.replace(';', '')
    consoleInput.push(js)
    writeStream(consoleInput, ast)
  }
})
// writes input into js file adding appropriate lines
function writeStream (input, ast) {
  var fs = require('fs')
  fs.writeFile('ast.txt', JSON.stringify(ast, null, 2), function(err) {
    if(err) return console.log(err)
  })
  var stream = fs.createWriteStream('out.js')
  stream.once('open', function (fd) {
    input = input.toString().split('\n')
    for (let statement in input) {
      let firstWord = input[statement].split(' ')
      firstWord = firstWord[0]
      if (firstWord === 'const') stream.write(input[statement] + '\n')
      else stream.write('console.log(' + input[statement] + ')' + '\n')
    }
    stream.end()
  })
}
