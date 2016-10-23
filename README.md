Parses basic LISP statements and generates AST.
Modifications : 'define' keyword is to be written as 'const', 
                'lambda' keyword is to be written as the arrow operator, '=>'. 
Input examples : (+ 5 5), 
                 (const a 10), 
                 (if (< 10 20) (+ 5 5) (+ 5 5 5 5)), 
                 (const fact => (n) (if (<= n 1) (1) (* n fact (- n 1))))
