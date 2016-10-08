function spaceParser (input) {
  if (input.charAt(0) === ' ') return input.replace(/\s+/, '')
  return input
}
function numberParser (input) {
  var numRegEx = (/^\d+/)
  if (numRegEx.test(input)) {
    var num = numRegEx.exec(input)
    var node = {
      type: 'Literal',
      value: parseInt(num[0], 10),
      raw: num[0]
    }
    AST(node)
    return input.replace(num[0], '')
  }
  return input
}
function stringParser (input) {
  if (input.charAt(0) === '"') {
    input = input.slice(1)
    var str
    var quoteIndex = input.indexOf('"')
    if (input.charAt(quoteIndex + 1) === ' ' || quoteIndex === input.length - 1) str = input.substr(0, quoteIndex)
    else {
      var indexMatch = (/"(\s|\))/).exec(input).index
      str = input.substr(0, indexMatch)
    }
    var node = {
      type: 'Literal',
      value: str,
      raw: '"' + str + '"'
    }
    AST(node)
    return input.replace(str, '')
  }
  return input
}
function identifierParser (input) {
  var kw = input.split(' ').slice(0, 1).toString()
  if (!~keywords.indexOf(kw) && /\w+/.test(kw) && !(/^\d/.test(kw))) {
    var id = input.split(' ').slice(0, 1)
    var node = {
      type: 'Identifier',
      name: id
    }
    AST(node)
    return input.replace(id, '')
  }
  return input
}
function keywordParser (input) {
  var kw = input.split(' ').slice(0, 1).toString()
  if (~keywords.indexOf(kw)) {
    var node
    if (kw === 'define') {
      if (~input.split(' ').indexOf('lambda')) node = { 'type': 'FunctionDeclaration' }
      else node = { 'type': 'VariableDeclaration', 'declarations': [] }
    }
    AST(node)
    return input.replace(kw, '')
  }
  return input
}
function expressionParser (input) {
  if (input.charAt(0) === '(') {
    var node = {
      'type': 'Program',
      'body': [],
      'sourceType': 'lisp'
    }
    AST(node)
    return input.slice(1)
  }
  if (input.charAt(0) === ')') return input.slice(1)
  return input
}
function parseEngine (input) {
  while (input.length > 0) {
    input = expressionParser(input)
    input = spaceParser(input)
    input = keywordParser(input)
    input = identifierParser(input)
    input = numberParser(input)
    input = stringParser(input)
  }
}
function AST (input) {
  if (typeof ast === 'undefined') ast = input
  else ast[ast_current].push(input)
}

var keywords = ['define', 'lambda']
var ast
var ast_current = 'body'
parseEngine('(define r 10)')
console.log(ast)
