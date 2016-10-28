module.exports = function (input) {

  var variables = []
  var body = []

  function spaceParser (input) {
    return (/^\s+/).test(input) ? [null, input.replace(/\s+/, '')] : null
  }

  function numberParser (input) {
    var numRegEx = /^[-+]?(\d+(\.\d*)?|\.\d+)/
    return (num = numRegEx.exec(input))
    ? [{ type: 'Literal', value: parseFloat(num[0], 10), raw: num[0] },
    input.replace(num[0], '')]
    : null
  }

  function closingBracketConsumer (input) {
    return (/^\)+/).test(input) ? [null, input.replace(/\)+/, '')] : null
  }

  function identifierParser (input) {
    var idRegEx = /^[a-z\~]+[a-z0-9_\[\]\.\*]*/i
    if (!idRegEx.exec(input)) return null
    word = idRegEx.exec(input)[0]
    variables.push(word)
    var node = { type: 'Identifier', name: word }
    return [node, input.replace(word, '')]
  }

  function stringParser (input) {
    if (input.charAt(0) !== '"') return null
    var str = input.substring(1, input.lastIndexOf('"'))
    var node = { type: 'StringLiteral', value: str }
    str = '"' + str + '"'
    return [node, input.replace(str, '')]
  }

  function booleanParser (input) {
    if (input.startsWith('true')) var node = {type: "Literal", value: true}
    else if (input.startsWith('false')) var node = {type: "Literal", value: false}
    else return null
    return [node, input.split(' ').slice(1).toString()]
  }

  function declaratorParser (input) {
    if (!input.startsWith('const')) return null
    input = input.replace('const', '')
    var expr = expressionParser(input)
    if (!expr) return null
    var node = { type: 'VariableDeclaration', declarations: [{
                type: 'VariableDeclarator', id: expr[0][0], init: expr[0][1] }],
                kind: 'const' }
    return [node, expr[1]]
  }

  function ifParser (input) {
    if (!input.startsWith('if')) return null
    input = input.replace('if', '')
    var expr = expressionParser(input)
    if (!expr) return null
    var node = { type: 'ExpressionStatement', expression:
                { type: 'ConditionalExpression', test: expr[0][0][0],
                consequent: expr[0][0][1][0], alternate: expr[0][0][1][1] }}
    return [node, expr[1]]
  }

  function functionCallParser (input)  {
    if (!~variables.indexOf(input.split(' ')[0])) return  null
    var word = input.split(' ')[0]
    input = input.replace(word, '')
    var expr = expressionParser(input)
    input = expr[1]
    node = { type: 'ExpressionStatement', expression: {
            type: 'CallExpression', callee:
            { type: 'Identifier', name: word }, arguments: expr[0] || '' }}
    return [node, '']
  }

  function lambdaIIFEParser (input) {
    input = input.replace('=>', '')
    var expr = expressionParser(input)
    if (!expr) return null
    node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: {
        type: 'ArrowFunctionExpression', id: null, params: [expr[0][0][0]],
        body: expr[0][0][1], generator: false, expression: true },
        arguments: [expr[0][1]]
      }
    }
    return [node, expr[1]]
  }

  function expressionParser (input) {
    var arr = []
    var brackets = /^\(+/.exec(input)
    while (input.length > 0) {
      if (input.charAt(0) === '(') {
        let expr = (expressionParser(input.replace(brackets, '')))
        input = expr[1].toString()
        arr.push(expr[0])
      }
      var expr = parserFactory(identifierParser, numberParser, stringParser, expressionParser)(input)
      input = expr[1].toString()
      arr.push(expr[0])
      if (input.charAt(0) === ')') return [arr, input.slice(1)]
    }
    return [arr, input]
  }

  var parserFactory = (...parsers) => function (input) {
    if (spaceParser(input)) input = spaceParser(input)[1]
    if (closingBracketConsumer(input)) input = closingBracketConsumer(input)
    return parsers.reduce((acc, parser) => acc === null ? parser(input) : acc, null)
  }

  function sExpressionParser (input) {
    var brackets = /^\(+/.exec(input)
    input = input.replace(brackets, '')
    if (input.startsWith('const')) body.push(declaratorParser(input)[0])
    else if (input.startsWith('=>')) body.push(lambdaIIFEParser(input)[0])
    else (expressionParser(input)[0]).forEach(function (atom) {
          body.push(atom)
          })
    return body
  }
  return sExpressionParser(input)
}
