var parser = require('./parser')
var ast = { type: 'Program', body: [], sourceType: 'script' }
var consoleInput = []

const escodegen = require('escodegen')
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
// repl
rl.on('line', (input) => {
  input = input.trim()
  if (input === 'exit') rl.close()
  try { var solution = parser(input) }
  catch (err) { if (input !== 'exit') console.log('Incorrect Syntax Mate', err) }
  if (input !== 'exit') {
    ast.body.push(solution.pop())
  }
  else {
    var js = escodegen.generate(ast)
    while (!!~js.indexOf(';')) js = js.replace(';', '')
    if (!!~js.indexOf('reduce')) js = js.replace(/\n/g, '')
    consoleInput.push(js)
    writeStream(consoleInput, ast)
  }
})
// writes input into out.js file adding appropriate lines
// writes ast into ast.txt
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
