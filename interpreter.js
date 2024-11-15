const fs = require('fs');

// Lexer: Tokenizes the input
function lexer(input) {
  const regex = /\s*(\d+|let|print|"[^\"]*"|[+\-*/()=;\w]+)/g;
  const tokens = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1]);
  }

  return tokens;
}

// Parser: Converts tokens into AST (Abstract Syntax Tree)
function parser(tokens) {
  let current = 0;

  function parseExpression() {
    let token = tokens[current];

    // Handle string literals
    if (token.startsWith('"') && token.endsWith('"')) {
      current++;
      return { type: 'Literal', value: token.slice(1, -1) }; // Remove quotes
    }

    if (token === 'let') {
      current++;
      const name = tokens[current++];
      if (tokens[current] !== '=') throw new Error("Expected '=' after variable name");
      current++;
      const value = parseExpression();
      return { type: 'Assignment', name, value };
    }

    if (token === 'print') {
      current++;
      const value = parseExpression();
      return { type: 'Print', value };
    }

    if (/\d+/.test(token)) {
      current++;
      return { type: 'Literal', value: Number(token) };
    }

    if (/[a-zA-Z_]\w*/.test(token)) {
      current++;
      return { type: 'Variable', name: token };
    }

    if (token === '(') {
      current++;
      const expr = parseExpression();
      if (tokens[current] !== ')') throw new Error("Expected ')'");
      current++;
      return expr;
    }

    if (token === '+' || token === '-' || token === '*' || token === '/') {
      const operator = token;
      current++;
      const left = parseExpression();
      const right = parseExpression();
      return { type: 'BinaryExpression', operator, left, right };
    }

    throw new Error('Unexpected token: ' + token);
  }

  const ast = [];
  while (current < tokens.length) {
    ast.push(parseExpression());
  }

  return ast;
}

// Interpreter: Evaluates the AST
class Interpreter {
  constructor() {
    this.environment = {};
  }

  evaluate(node) {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Variable':
        // If the variable is not defined in the environment, throw an error
        if (this.environment[node.name] === undefined) {
          throw new Error(`Variable ${node.name} is not defined`);
        }
        return this.environment[node.name];

      case 'Assignment':
        // Assign the value of the expression to the variable
        this.environment[node.name] = this.evaluate(node.value);
        return this.environment[node.name];

      case 'BinaryExpression':
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
          case '+':
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            return left / right;
          default:
            throw new Error(`Unknown operator: ${node.operator}`);
        }

      case 'Print':
        // Print the evaluated value to the console
        console.log(this.evaluate(node.value));
        break;

      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  run(ast) {
    for (const node of ast) {
      this.evaluate(node);
    }
  }
}

// Main function: Runs the code from .ep file
function runFile(filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    const tokens = lexer(data);
    const ast = parser(tokens);
    const interpreter = new Interpreter();
    interpreter.run(ast);
  });
}

// Read the filename from the command line arguments
const filePath = process.argv[2]; // The second argument (after 'node' and 'interpreter.js')

if (!filePath) {
  console.log('Please provide a file name as an argument.');
  process.exit(1);
}

runFile(filePath); // Run the provided .ep file
