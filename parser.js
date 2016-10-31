module.exports = function (input) {
  const unaryOperations = ['length', 'abs', 'round', 'not', 'min', 'max', 'round', 'quote']
  const arithmeticOperators = ['*', '+', '-', '/', '%', '<', '>', '<=', '>=', 'pow', 'append']
  const variables = []
  const body = []
  const astBody = []

  function spaceParser (input) {
    return (/^\s+/).test(input) ? [null, input.replace(/\s+/, '')] : null
  }

  function numberParser (input) {
    const numRegEx = /^[-+]?(\d+(\.\d*)?|\.\d+)/
    return (num = numRegEx.exec(input))
      ? [{ type: 'Literal', value: parseFloat(num[0], 10), raw: num[0] },
        input.replace(numRegEx, '')]
      : null
  }

  function identifierParser (input) {
    const idRegEx = /^[a-z\~]+[a-z0-9_\[\]\.\*]*/i
    if (!idRegEx.exec(input)) return null
    const word = idRegEx.exec(input)[0]
    variables.push(word)
    const node = { type: 'Identifier', name: word }
    return [node, input.replace(word, '')]
  }

  function stringParser (input) {
    if (input.charAt(0) !== '"') return null
    let str = input.substring(1, input.lastIndexOf('"'))
    const node = { type: 'StringLiteral', value: str }
    str = '"' + str + '"'
    return [node, input.replace(str, '')]
  }

  function booleanParser (input) {
    if (!/^true|false/.test(input)) return null
    const node = {type: 'Literal', value: ''}
    if (input.startsWith('false')) node.value = false
    if (input.startsWith('false')) node.value = true
    return [node, input.split(' ').slice(1).toString()]
  }

  function arithmeticParser (input) {
    const operator = input.replace(/^\s*\(*\s*/, '').split(' ')[0]
    if (!~arithmeticOperators.indexOf(operator)) return null
    const expr = expressionParser(input.replace(/^\s*\(*\s*/, '').replace(operator, ''))
    if (!expr) return null
    if (expr[0].length < 3) node = binaryParser(expr[0], operator)
    else node = reduceArr(expr[0], operator)
    return [node, expr[1]]
  }

  function unaryParser (input) {
    const operator = input.replace(/^\s*\(*\s*/, '').split(' ')[0]
    if (!~unaryOperations.indexOf(operator)) return null
    const expr = expressionParser(input.replace(operator, ''))
    if (!expr) return null
    const node = { type: 'Expression', operator: operator, arg: expr[0] }
    return [node, expr[1]]
  }

  function binaryParser (input, word) {
    const node = { type: 'BinaryExpression', operator: word, left: input[0], right: input[1] }
    return node
  }

  function reduceArr (input, word) {
    const node = { type: 'ExpressionStatement',
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

  function declaratorParser (input) {
    const constRegEx = /^\s*\(*\s*const/
    if (!constRegEx.exec(input)) return null
    const expr = expressionParser(input.replace(constRegEx, ''))
    if (!expr) return null
    const node = { type: 'VariableDeclaration', declarations: [{
      type: 'VariableDeclarator', id: expr[0][0], init: '' }],
      kind: 'const' }
    node.declarations[0].init = expr[0][1][0] ? expr[0][1][0] : expr[0][1]
    return [node, expr[1]]
  }

  function lambdaParser (input) {
    if (!(/^\s*\(*\s*=>/.exec(input))) return null
    input = input.replace(/\s*\(*\s*=>/, '')
    variables.push('function')
    const expr = expressionParser(input)
    if (!expr) return null
    const node = { type: 'ArrowFunctionExpression', id: null, params: expr[0][0],
      body: '', generator: false, expression: true }
    const body = expr[0][1][0] ? expr[0][1][0] : expr[0][1]
    Object.keys(body).length > 4 ? node.body = { type: 'BlockStatement', body: [body] }
              : node.body = body
    return [node, expr[1]]
  }

  function functionCallParser (input) {
    const word = input.replace(/^\s*\(*\s*/, '').split(' ')[0]
    const varDict = variables.indexOf(word)
    if (!~varDict || variables[varDict + 1] !== 'function') return null
    input = input.replace(word, '')
    const expr = expressionParser(input)
    if (!expr) return null
    const node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: { type: 'Identifier', name: word },
      arguments: expr[0] || '' }}
    return [node, expr[1]]
  }

  function lambdaIIFEParser (input) {
    input = input.replace(/^\s*\(*\s*=>/, '')
    const expr = expressionParser(input)
    if (!expr) return null
    const node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: {
        type: 'ArrowFunctionExpression', id: null, params: expr[0][0],
        body: '', generator: false, expression: true },
      arguments: [expr[0][2]] }}
    node.expression.callee.body = expr[0][1][0] ? expr[0][1][0] : expr[0][1]
    return [node, expr[1]]
  }

  function ifParser (input) {
    const ifRegEx = /^\s*\(*\s*if/
    if (!ifRegEx.exec(input)) return null
    const expr = expressionParser(input.replace(/\s*\(*\s*if/, ''))
    const node = { type: 'ExpressionStatement', expression:
      { type: 'ConditionalExpression', test: '',
      consequent: '', alternate: '' }}
    node.expression.test = expr[0][0][0] ? expr[0][0][0] : expr[0][0]
    node.expression.consequent = expr[0][1][0] ? expr[0][1][0] : expr[0][1]
    node.expression.alternate = expr[0][2][0] ? expr[0][2][0] : expr[0][2]
    return [node, expr[1]]
  }

  function expressionParser (input) {
    let arr = []
    while (input.length > 0) {
      if (/^\)+/.exec(input)) input = input.replace(/\)+/, '')
      const expr = parserFactory(seParser, declaratorParser, ifParser,
        arithmeticParser, unaryParser, lambdaParser, functionCallParser,
        identifierParser, numberParser, booleanParser, stringParser)(input)
      if (expr) {
        input = expr[1].toString()
        arr.push(expr[0])
      }
      else input = ''
    }
    return [arr, input]
  }

  function seParser (input) {
    if (!(/^\s*\(/).test(input)) return null
    if (spaceParser(input)) input = spaceParser(input)[1]
    let openingParen = 0
    for (let i = 0; i < input.length; i++) {
      if (input.charAt(i) === '(') openingParen++
      if (input.charAt(i) === ')') openingParen--
      if (openingParen === 0) return [expressionParser(input.slice(1, i))[0], input.substr(i + 1)]
    }
  }

  const parserFactory = (...parsers) => function (input) {
    if (spaceParser(input)) input = spaceParser(input)[1]
    return parsers.reduce((acc, parser) => acc === null ? parser(input) : acc, null)
  }

  function sExpressionParser (input) {
    if (/^\s*\(*\s*const/.exec(input)) return declaratorParser(input)[0]
    if (/^\s*\(*\s*=>/.exec(input)) return lambdaIIFEParser(input)[0]
    if (/^\s*\(*\s*if/.exec(input)) return ifParser(input)[0]
    expressionParser(input)[0].forEach(function (atom) {
      body.push(atom)
    })
    return body
  }

  function programParser (input) {
    input = input.split('\n')
    for (let i = 0; i < input.length; i++) {
      astBody.push(sExpressionParser(input[i]))
    }
    return astBody
  }

  return programParser(input)
}
