function expressionParser () {
  //spaceParser()
  if (input.charAt(0) === '(') {
    input = input.slice(1)
    var node = {
      'type': 'Program',
      'body': [keywordParser()],
      'sourceType': 'lisp'
    }
    return node
  }
}
function keywordParser () {
  spaceParser()
  var kw = input.split(' ').slice(0, 1).toString()
  if (~keywords.indexOf(kw)) {
    var node
    if (kw === 'define') {
      input = input.replace(kw, '')
      var lambdaIndex = input.split(' ').indexOf('(lambda')
      if (~lambdaIndex) {
        input = input.split(' ')
        input.splice(lambdaIndex, 1)
        input = input.join(' ')
        node = functionDeclarator()
      }
      else node = variableDeclarator()
      return node
    }
    if (kw === 'return') {
      node = returnWriter()
      input = input.replace(kw, '')
      return node
    }
    if (kw === '*') {
      input = input.replace(kw, '')
      var node = {
        'type': 'BinaryExpression',
        'operator': kw,
        'left': identifierParser(),
        'right': identifierParser()
      }
      return node
    }
  }
}
function functionDeclarator () {
  var node = {
      'type': 'FunctionDeclaration',
      'id': identifierParser(),
      'params': [identifierParser()],
      'body': {
        'type': 'BlockStatement',
        'body': [keywordParser()]
      }
  }
  return node
}
function variableDeclarator () {
  var node = {
    'type': 'VariableDeclaration',
    'declarations': [
      {'type': 'VariableDeclarator',
      'id': identifierParser(),
      'init': numberParser()
    }
  ]
  }
  return node
}
function returnWriter () {
  var node = {
    'type': 'ReturnStatement',
    'argument': keywordParser() // || identifierParser(
  }
  return node
}
function identifierParser () {
  spaceParser()
  var kw = input.split(' ').slice(0, 1).toString()
  if (!~keywords.indexOf(kw) && /\w+/.test(kw) && !(/^\d/.test(kw))) {
    var id = input.split(' ').slice(0, 1).toString()
    var node = {
      type: 'Identifier',
      name: id
    }
    input = input.replace(id, '')
    return node
  }
}
function numberParser () {
  spaceParser()
  var numRegEx = (/^\d+/)
  if (numRegEx.test(input)) {
    var num = numRegEx.exec(input)
    var node = {
      type: 'Literal',
      value: parseInt(num[0], 10),
      raw: num[0]
    }
    input = input.replace(num[0], '')
    return node
  }
}
function spaceParser () {
  if (input.charAt(0) === ' ') input = input.replace(/\s+/, '')
  if (input.charAt(0) === '(' || input.charAt(0) === ')') input = input.slice(1)
  if (input.charAt(0) === ' ') input = input.replace(/\s+/, '')
}
var keywords = ['define', 'return', '*']
var input = '(define square (lambda (x) (* x x)))'
//var input = '(define a 10)'
var answerNode = (expressionParser())
console.log(answerNode.body[0].body.body)
