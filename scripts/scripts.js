/*
The calculation method first converts the prefix expression into a postfixed expression and then runs a stack-based algorithm to calculate the expression result.
This is known as a Shunting-Yard algorithm, which typically takes a two pass-through approach, one to convert to postfix and another to run a stack algorithm for calculation. 
My approach performs both in a single pass-through.
*/

const operators = ["+", "-", "x", "/", "^"];
// const pattern = /(\d+\.\d+|\d+|(?<=\))-|(?<=\D|^)-\d+|\+|\-|x|\^|\/|\(|\))/g; 
let expression = []; // Stores the user's input in an array as inputs are added. Makes it easier to clear by popping the array and updating the preview window with innerHTML.

function handleNumber(num) {
  const lastIndex = expression.length - 1;
  if(expression[lastIndex] === ")") {
    expression.push("x");
    expression.push(num);
  } else if(!isNaN(expression[lastIndex])) {
    expression[lastIndex] += num.toString();
  } else { 
    expression.push(num);
  }
  updatePreview();
}

function handleParenthesis() {
  const lastIndex = expression.length - 1;
  let openPara = 0; // Will track how many open parenthesis found
  let closePara = 0; // Will track how many closing parenthesis found.
  for(let i = 0; i < expression.length; i++) { // Loop to count the parenthesis so we know which parenthesis our "( )" button will insert.
    if(expression[i] === "(") {
      openPara++;
    } else if(expression[i] === ")") {
      closePara++;
    }
  }
  if(!isNaN(expression[lastIndex]) || expression[lastIndex] === ")") { // If the last index is a number or closing parenthesis
    if(openPara > closePara) { // and there are more opening parenthesis than closing, then we add a closing parenthesis to the expression
      expression.push(")");
    } else { // otherwise we add a multiplication operator and an opening parenthesis
      expression.push("x");
      expression.push("(");
    }
  } else if(expression[lastIndex] === "(" || operators.indexOf(expression[lastIndex]) !== -1 || expression.length === 0) { // If the last index is a "(", an operator or the expression array is empty.
    expression.push("("); // then we just add an opening parenthesis
  }
  updatePreview();
}

function handleOperator(op) {
  const lastIndex = expression.length - 1;
  if(expression[lastIndex] === "(" || expression[lastIndex].toString().indexOf(".") === expression[lastIndex].length-1 || expression.length === 0) { // Placing an operator after these symbols is incorrect expression format, so we return
    return;
  } else if(operators.indexOf(expression[lastIndex]) !== -1) { // If there is already an expression at the end of the expression, we replace it.
    expression.pop();
    expression.push(op);
  } else {
    expression.push(op);
  }
  op === "^" ? handleExponent() : undefined; // If the operator is an exponent, we call the handleExponent function.
  updatePreview();
}

// This helps correctly compute -x**y vs (-x)**y by flipping -x to positive when presented as (-x), since the calculation always runs either (x**y) or -(x**y).
function handleExponent() {
  const index = expression.length - 2; // Sets index to the index rightr before the exponent
  if(expression[index] === ")" && expression[index-1] < 0) {
    expression[index-1] /= -1;
  }
}

function handleDecimal() { // We need to check if it's valid to place another decimal. We can do this by making sure the most recent decimal came BEFORE the most recent operator or parenthesis.
  const lastIndex = expression.length - 1;
  if(isNaN(expression[lastIndex])) {
    return;
  } else {
    if(expression[lastIndex].toString().indexOf(".") === -1) {
      expression[lastIndex] += ".";
    }
  }
  updatePreview();
}

function handlePositiveNegative() { // Convert the latest number to negative or positive
  const lastIndex = expression.length-1;
  if(isNaN(expression[lastIndex])) {
    return;
  } else {
    const num = expression[lastIndex];
    expression[lastIndex] = num > 0 ? num * -1 : num / -1;
  }
  updatePreview();
}

function clearRecent(clear) {
  const lastIndex = expression.length-1;
  if(clear === 1 && expression[lastIndex].length > 1) { // If it's a double digit number, we split the array into multiple indexes so we can remove the last digit only. This creates the backspace functionality.
    expression[lastIndex] = expression[lastIndex].slice(0,-1); // Removes the last digit
    } else if(clear === 1) {
      expression.pop();
    } else {
      expression = [];
    }
  updatePreview();
}

function updatePreview() {
  const element = document.getElementById("result");
  (expression.length === 0) ? element.innerHTML = "0" : element.innerHTML = expression.join("");
}

function equalButton() {
  const lastIndex = expression.length - 1;
  let openPara = 0;
  let closePara = 0;
  for(let i=0; i < expression.length; i++) {
    // Count the occurances of ( and ) to make sure the expression is valid.
    if(expression[i] === "(") {
      openPara++;
    } else if(expression[i] === ")") {
      closePara++;
    }
    // Find every number and makes sure it is converted from a string to an integer so we don't have to do so later.
    if(!isNaN(expression[i])) {
      expression[i] = parseFloat(expression[i]);
    }
  }
  if(expression[lastIndex] === "(" || expression[lastIndex].toString().indexOf(".") === expression[lastIndex].length-1  || operators.indexOf(expression[lastIndex]) !== -1 || openPara > closePara) {
    expression.push(" Invalid Expression");
    updatePreview();
    expression.pop();
    return;
  } else {
    const result = calculateInput(expression);
    const element = document.getElementById("result");
    element.innerHTML = result;
  }
}

function calculateInput(postFixThis) {
  console.log("Working on expression:");
  console.log(postFixThis);
  let stack = [];
  let opStack = [];
  let postFixexpression = [];
  postFixThis.forEach(value => {
    if(operators.includes(value)) { // If the current index is an operator
      while(opEval(value) <= opEval(opStack[opStack.length - 1])) { // If the operator at the top of the opStack is equal or of higher importance. No need to check if it's empty because that will return -1.
        postFixexpression.push(opStack[opStack.length - 1]);
        stack.push(opStack.pop()); // Push the top of the operator stack to the expression
        if(stack.length >= 3) {
          runCalc();
        }
      }
      opStack.push(value);
    } else if(!isNaN(value) || value === "(") { // If the current value is a number or an opening parenthesis, push it to the corresponding opStack/array.
      if(value === "(") {
        opStack.push(value);
      } else {
        stack.push(value);
        postFixexpression.push(value);
      }
    } else if(value === ")") { // If the current value is a closing parenthesis, pop operators from the opStack onto the expression until an opening parenthesis is found
      while(operators.includes(opStack[opStack.length - 1])) { // While the top of the opStack is an operator (because if it isn't, it's an opening parenthesis)
        postFixexpression.push(opStack[opStack.length - 1]);
        stack.push(opStack.pop());
        runCalc();
      }
      opStack.pop(); // Remove ( from the stack
    }
  });
  console.log("opStack and stack are");
  console.log(opStack, stack);
  while(opStack.length >= 1 || stack.length === 3) { // Finish popping any leftover operators from the operator opStack to the expression.
    if(operators.includes(stack[stack.length - 1])) {
      runCalc();
    } else {
      postFixexpression.push(opStack[opStack.length - 1]);
      stack.push(opStack.pop());
    }
  }
  console.log(`Finished post-fixed expression:${postFixexpression}`);
  console.log(`Result of calculation: ${stack[0]}`);
  expression = stack;
  return stack[0]; // Returns the result

  function runCalc() {
    const op = stack.pop();
    const num2 = stack.pop();
    const num1 = stack.pop();
    console.log("Running calc on");
    console.log(num1, op, num2);
    switch (op) {
      case "^":
        num1 < 0 ? stack.push(-(num1 ** num2)) : stack.push(num1 ** num2); // -x ** y doesn't work because JavaScript doesn't like a - before exponent, so we're forced to do -(x ** y) for the correct output.
        break;
        
      case "x":
        stack.push(num1 * num2);
        break;

      case "/":
        if(num2 == 0) {
          console.log("Division by zero not allowed");
          return Error;
        }
        stack.push(num1 / num2);
        break;

      case "+":
        stack.push(num1 + num2);
        break;

      case "-":
        stack.push(num1 - num2);
        break;
    }
    console.log("stack after calc");
    console.log(stack);
  }

  function opEval(op) {
    if(op === "+" || op === "-") {
      return 1;
    } else if(op === "x" || op === "/") {
      return 2;
    } else if(op === "^") {
      return 3;
    } else {
      return -1;
    }
  }
}