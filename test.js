const parser = require('./parser')
const ast = { type: 'Program', body: '', sourceType: 'script' }
let consoleInput = []
let jsOut = []

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
    try {
      var js = escodegen.generate(ast)
    } catch (e) {
      console.log(`You probably put some brackets in the wrong places, or..
This program doesn't have the particular functionality`)
    }
    js = js.replace(/\n/g, '').replace(/;/g, '\n').trim()
    js = js.split('\n')
    while (js.length > 0) {
      if (js[0].charAt(0) === ' ') {
        jsOut[jsOut.length - 1] += js.shift()
        continue
      }
      jsOut.push(js.shift())
    }
    writeStream(jsOut.join('\n'), ast)
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
      if (firstWord === 'const' || firstWord.length === 0) stream.write(input[statement] + '\n')
      else stream.write('console.log(' + input[statement] + ')' + '\n')
    }
    stream.end()
  })
}
