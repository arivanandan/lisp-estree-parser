module.exports = function (input) {
  const astBody = []                                                            // stores generated ast of entire program

  function spaceParser (input) {
    return (/^\s+/).test(input) ? [null, input.replace(/\s+/, '')] : null
  }

  function numberParser (input) {
    return [{ type: 'Literal', value: parseFloat(input[1], 10), raw: input[1] },
        input[input.length - 1]]
  }

  function identifierParser (input) {
    return [{ type: 'Identifier', name: input[1] }, input[input.length - 1]]
  }

  function stringParser (input) {
    return [{ type: 'StringLiteral', value: '"' + input[1] + '"' }, input[input.length - 1]]
  }

  function booleanParser (input) {
    return [{type: 'Literal', value: input[1]}, input[input.length - 1]]
  }

  function arithmeticParser (input) {
    const operator = input[2]
    const expr = expressionParser(input[0].replace(input[1], ''))
    if (!expr) return null
    let node
    if (expr[0].length < 3) node = binaryExpressionParser(expr[0], operator)
    else node = reduceArr(expr[0], operator)
    return [node, expr[1]]
  }

  function unaryParser (input) {
    const operator = input[2]
    const expr = expressionParser(input[0].replace(input[1], ''))
    if (!expr) return null
    const node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: {
        type: 'MemberExpression', computed: false,
        object: { type: 'Identifier', name: 'Math' },
        property: { type: 'Identifier', name: operator }},
      arguments: expr[0] }}
    return [node, expr[1]]
  }

  function binaryExpressionParser (input, word) {
    const node = { type: 'BinaryExpression', operator: word, left: '', right: '' }
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
    const expr = expressionParser(input[0].replace(input[1], ''))
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
    const paramsRaw = input[2].match(/^\s*\([^)]*\)\s/)[0]                      // separates parameters
    const params = expressionParser(paramsRaw.replace(/\s*[\(\)]/g, ''))
    const expr = expressionParser(input[2].replace(paramsRaw, ''))              // expression body
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
    const word = input[0].replace(/^\s*\(*\s*/, '').split(' ')[0].replace(/\)/, '')
    const node = { type: 'ExpressionStatement', expression: {
      type: 'CallExpression', callee: ''}}
    if (word !== '=>') {                                                        // function calls
      const expr = expressionParser(input[0].replace(/^\s*\(*\s*/, '').replace(word, ''))
      node.expression.callee = { type: 'Identifier', name: word }
      node.expression.arguments = expr[0] || ''
      return [node, expr[1]]
    }
    input = input[0].slice(1, -1)                                               // IIEF
    const expr = expressionParser(input.substr(input.lastIndexOf(')')))
    node.expression.callee = expressionParser(input.substring(0, input.lastIndexOf(')')))[0].pop()
    node.expression.arguments = expr[0] || ''
    return [node, expr[1]]
  }

  function ifParser (input) {
    const expr = expressionParser(input[0].replace(input[1], ''))
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
      const [parser, val] = regExMatcher([lambdaParser, /^(\(*\s*=>)(.*)/],
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
// tries the main parsers
  function sExpressionParser (input) {
    const [parser, val] = regExMatcher([declaratorParser, /^(\s*\(*\s*const)(.*)/],
                            [ifParser, /^(\s*\(*\s*if)(.*)/],
                            [arithmeticParser, /^(\s*\(*\s*(<=|>=|pow|append|[+-\/\*><]))(.*)/],
                            [unaryParser, /^(\s*\(*\s*(abs|round|not|min|max|round))(.*)/],
                            [functionCallParser, /^(\s=>|[a-z]*)(.*)$/i],
                            [errorThrow, /.*/])(input)
    return parser(val)[0]
  }
  // matches with regExs and calls the function matching the regEx
  const regExMatcher = (...regEx) => input => {
    if (spaceParser(input)) input = spaceParser(input)[1]
    return regEx.reduce((acc, regEx) => acc[1] === null
                          ? [regEx[0], regEx[1].exec(input)]
                          : acc, [null, null]) }

  function errorThrow () {
    try {
    } finally {
      throw new Error(`\n\nIncorrect Expression Syntax
        Accepted Expression Formats:
        * ("if"(condition) expression)
        * (arithmeticOperation arguments)
        * ("const" identifier variable/expression)
        * (functioncalls arguments)\n\n`)
    }
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
