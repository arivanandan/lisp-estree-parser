var parser = require('./parser')
var ast = { type: 'Program', body: '', sourceType: 'script' }
var consoleInput = []
var jsOut = []

const escodegen = require('escodegen')
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
// repl
rl.on('line', (input) => {
  if (input === 'exit') rl.close()
  if (input !== 'exit') {
    consoleInput += input + '\n'
  } else {
    var solution = parser(consoleInput.trim())
    ast.body = solution
    var js = escodegen.generate(ast)
    while (!!~js.indexOf(';')) js = js.replace(';', '')
    if (!!~js.indexOf('reduce')) js = js.replace(/\n/g, '')
    jsOut.push(js)
    writeStream(jsOut, ast)
  }
})
// writes input into out.js file adding appropriate lines
// writes ast into ast.txt
function writeStream (input, ast) {
  var fs = require('fs')
  fs.writeFile('ast.txt', JSON.stringify(ast, null, 2), function (err) {
    if (err) return console.log(`Error in Execution\n   `, err)
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
