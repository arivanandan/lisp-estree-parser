module.exports = function (input) {
  const unaryOperators = ['length', 'abs', 'round', 'not', 'min', 'max', 'round', 'quote'],
        arithmeticOperators = ['*', '+', '-', '/', '%', '<', '>', '<=', '>=', 'pow', 'append'],
        astBody = []                                                // stores generated ast of entire program

  function spaceParser (input) {
    return (/^\s+/).test(input) ? [null, input.replace(/\s+/, '')] : null
  }

  function numberParser (input) {
      return [{ type: 'Literal', value: parseFloat(input[1], 10), raw: input[1] },
        input[input.length - 1]]
  }

  function identifierParser (input) {
    return [{ type: 'Identifier', name: input[1] }, input[input.length -1]]
  }

  function stringParser (input) {
    return [{ type: 'StringLiteral', value: '"' + input[1] + '"' }, input[input.length - 1]]
  }

  function booleanParser (input) {
    return [{type: 'Literal', value: input[1]}, input[input.length - 1]]
  }

  function arithmeticParser (input) {
    const operator = input.replace(/^\s*\(*\s*/, '').split(' ')[0]
    if (!~arithmeticOperators.indexOf(operator)) return null
    const expr = expressionParser(input.replace(/^\s*\(*\s*/, '').replace(operator, ''))
    if (!expr) return null
    let node
    if (expr[0].length < 3) node = binaryParser(expr[0], operator)
    else node = reduceArr(expr[0], operator)
    return [node, expr[1]]
  }

  function unaryParser (input) {
    const operator = input.replace(/^\s*\(*\s*/, '').split(' ')[0]
    if (!~unaryOperators.indexOf(operator)) return null
    const expr = expressionParser(input.replace(operator, ''))
    if (!expr) return null
    const node = { type: 'Expression', operator: operator, arg: expr[0] }
    return [node, expr[1]]
  }

  function binaryParser (input, word) {
    const node = { type: 'BinaryExpression', operator: word, left: input[0], right: input[1] }
    node.left = input[0][0] ? input[0][0] : input[0]
    node.right = input[1][0] ? input[1][0] : input[1]
    return node
  }
// reduce function for operations with more than 2 arguments
  function reduceArr (input, word) {
    return { type: 'ExpressionStatement',
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
  }

  function declaratorParser (input) {
    const constRegEx = /^\s*\(*\s*const/
    const expr = expressionParser(input.replace(constRegEx, ''))
    if (!expr) return null
    const node = { type: 'VariableDeclaration', declarations: [{
      type: 'VariableDeclarator', id: expr[0][0], init: '' }],
      kind: 'const' }
    node.declarations[0].init = expr[0][1][0]
      ? expr[0][1][0]
      : expr[0][1]
    return [node, expr[1]]
  }

  function lambdaParser (input) {
    input = input[0].replace(/\s*\(?\s*=>/, '')
    const paramsRaw = input.match(/\s*\(.?\)/)[0]
    const params = expressionParser(paramsRaw.replace(/\s*[\(\)]/g, ''))
    const expr = expressionParser(input.replace(paramsRaw, ''))
    if (!expr) return null
    const node = { type: 'ArrowFunctionExpression', id: null, params: params[0] || '',
      body: '', generator: false, expression: true }
    const body = expr[0][0] ? expr[0][0] : expr[0]
    Object.keys(body).length > 4
              ? node.body = { type: 'BlockStatement', body: [body] }
              : node.body = body
    return [node, expr[1]]
  }

  function functionCallParser (input) {
    const word = input.replace(/^\s*\(*\s*/, '').split(' ')[0].replace(/\)/, '')
    const node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: ''}}
    if (word !== '=>') {                                                        // function calls
      const expr = expressionParser(input.replace(/^\s*\(*\s*/, '').replace(word, ''))
      node.expression.callee = { type: 'Identifier', name: word }
      node.expression.arguments = expr[0] || ''
      return [node, expr[1]]
    }
    input = input.slice(0, -1)                                                  // IIEF
    const expr = expressionParser(input.substr(input.lastIndexOf(')')))
    node.expression.callee = lambdaParser(input.substring(0, input.lastIndexOf(')')))[0]
    node.expression.arguments = expr[0] || ''
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
// loops through until all the tokens in an expression are consumed
  function expressionParser (input) {
    let arr = []
    while (input.length > 0) {
      if (/^\)+/.exec(input)) input = input.replace(/\)+/, '')
      if (spaceParser(input)) input = spaceParser(input)[1]
      const [parser, val] = regExFactory([lambdaParser, /^(\(*\s*=>.+)(.*)/],
                              [seParser, /^\(/],
                              [identifierParser, /^([a-z\~]+[a-z0-9_\[\]\.\*]*)(.*)$/i],
                              [numberParser, /^([-+]?(\d+(\.\d*)?|\.\d+))(.*)$/],
                              [booleanParser, /^(true|false)(.*)$/],
                              [stringParser, /^(".+")(.*)/])(input)
      let expr
      if (val) expr = parser(val)
      if (expr) {
        input = expr[1].toString()
        arr.push(expr[0])
      }
      else input = ''
    }
    return [arr, input]
  }
// interprets subexpressions (i.e expressions within brackets)
  function seParser (input) {
    let openingParen = 0
    for (let i = 0; i < input.input.length; i++) {
      if (input.input.charAt(i) === '(') openingParen++
      if (input.input.charAt(i) === ')') openingParen--
      if (openingParen === 0) return [sExpressionParser(input.input.slice(1, i)), input.input.substr(i + 1)]
    }
  }
// matches with regExs and calls the function matching the regEx
  const regExFactory = (...regEx) => input => {
    if (spaceParser(input)) input = spaceParser(input)[1]
    return regEx.reduce((acc, regEx) => acc[1] === null
                        ? [regEx[0], regEx[1].exec(input)]
                        : acc, [null, null]) }
// tries the main parsers
  function sExpressionParser (input) {
    if (/^\s*\(*\s*const/.exec(input)) return declaratorParser(input)[0]
    if (/^\s*\(*\s*if/.exec(input)) return ifParser(input)[0]
    if (!!~arithmeticOperators.indexOf(input.replace(/^\s*\(*\s*/, '').split(' ')[0]))
      return arithmeticParser(input)[0]
    if (!!~unaryOperators.indexOf(input.replace(/^\s*\(*\s*/, '').split(' ')[0]))
      return unaryParser(input)[0]
    return functionCallParser(input)[0]
  }
// splits the program with /newline and passes them one by one
  function programParser (input) {
    input = input.split('\n')
    for (let i = 0; i < input.length; i++) {
      astBody.push(sExpressionParser(input[i]))
    }
    return astBody
  }
  return programParser(input)
}
