Parses basic LISP statements and generates AST (as would be from http://esprima.org/demo/parse.html) which is then turned into JS using escodegen (https://github.com/estools/escodegen) and saved into an out.js file. Run in nodejs.                              

Modifications :                                                                                                          
'define' keyword is to be written as 'const',                                                            
'lambda' keyword is to be written as the arrow operator, '=>'.                                            

Supports:
simple arithmetic with 2 or more paramters                                                    
math operations such as max, min                                                                    
conditionals : if statements
variable declarations and working with them                                                         
immediately invoked function expressions
function recursion

Input examples :                                                                                                         
(+ 5 5)                                                                                                      
(const a 10)                                                                                                
(if (< 10 20) (+ 5 5) (+ 5 5 5 5))                                                                           
(const fact (=> (n) (if (<= n 1) 1 (* n fact (- n 1)))))                                                     
((=> (a) (* a a)) 5)                                                                                        
((=> (a b c) (+ a b c)) 1 2 3)
