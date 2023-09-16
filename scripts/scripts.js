/*
The calculation method first converts the prefix expression into a postfixed expression and then runs a stack-based algorithm to calculate the expression result.
This is known as a Shunting-Yard algorithm, which typically takes a two pass-through approach, one to convert to postfix and another to run a stack algorithm for calculation. 
My approach performs both in a single pass-through.
*/

const operators = ["+", "-", "x", "/", "^"];
const pattern = /(\d+\.\d+|\d+|\+|\-|x|\^|\/|\(|\))/g; // The pattern needed to convert the expression into the proper array format before running it through the calculating functions.
let expression = []; // Stores the user's input in an array as inputs are added. Makes it easier to clear by popping the array and updating the preview window with innerHTML.

function handleNumber(num) {
  const lastIndex = expression.length - 1;
  if(expression[lastIndex] === ")") {
    expression.push("x");
    expression.push(num);
  } else if(!isNaN(expression[lastIndex])) {
    expression[lastIndex] += num.toString();
  } else { // Change back to || last index is ".", because we won't need the next else if statement once we revert back to every character having it's own index
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
  if(expression[lastIndex] === "(" || expression[lastIndex] === "." || expression.length === 0) { // Placing an operator after these symbols is incorrect expression format, so we return
    return;
  } else if(operators.indexOf(expression[lastIndex]) !== -1) { // If there is already an expression at the end of the expression, we replace it.
    expression.pop();
    expression.push(op);
  } else {
    expression.push(op);
  }
  updatePreview();
}


function handleDecimal() { // We need to check if it's valid to place another decimal. We can do this by making sure the most recent decimal came BEFORE the most recent operator or parenthesis.
  const lastIndex = expression.length - 1;
  if(isNaN(expression[lastIndex])) {
    return;
  } else {
    const decimalIndex = expression.lastIndexOf(".");
    let operatorIndex = 0;
    operators.forEach(op => {
      let indexCheck = expression.lastIndexOf(op);
      console.log(`${op} found at index ${indexCheck}`);
      if(indexCheck > operatorIndex) {
        operatorIndex = indexCheck;
      }
    })
    if(operatorIndex > decimalIndex) { // We can only add another decimal if 
      expression.push(".");
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
    if(num > 0) {
      expression[lastIndex] = num * -1;
    } else if(num < 0) {
      expression[lastIndex] = num / -1;
    }
  }
  updatePreview();
}

function clearRecent(clear) {
  if(clear === 1) {
    expression.pop();
  } else {
    expression = [];
  }
  updatePreview();
}

function updatePreview() {
  const element = document.getElementById("result");
  if(expression.length === 0) {
    element.innerHTML = "0";
  } else {
    element.innerHTML = expression.join("");
  }
}

function equalButton() {
  const lastIndex = expression.length - 1;
  let openPara = 0;
  let closePara = 0;
  for(let i = 0; i < expression.length; i++) {
    if(expression[i] === "(") {
      openPara++;
    } else if(expression[i] === ")") {
      closePara++;
    }
  }
  if(expression[lastIndex] === "(" || expression[lastIndex] === "." || operators.indexOf(expression[lastIndex]) !== -1 || openPara > closePara) {
    expression.push(" Invalid Expression");
    updatePreview();
    expression.pop();
    return;
  } else {
    expression = expression.join("").match(pattern); // Converts the expression into the proper format for running the calculation function(s).
    for(let i=0; i<expression.length; i++) { // A for loop to search for "-" and combine them with their respective integer when they represent a negative number and not an operator. I'm bad at RegEx so I couldn't find a regex that would identity both when it was an operator and when it belonged to an integer.
      if(expression[i] === "-") {
        if(isNaN(expression[i-1]) && expression[i-1] !== ")") { // If the index before the "-" is not a number and also not a closing parenthesis
          expression[i] = expression[i] + expression[i+1]; // then we combine this index with the index in front of it, which must be a number
          expression.splice(i+1,1); // and then we remove the index in front of the "-"
        }
      }
    }
    const result = calculateInput(expression);
    const element = document.getElementById("result");
    element.innerHTML = result;
  }
}

function calculateInput(postFixThis) {
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
    } else if(!isNaN(parseFloat(value)) || value === "(") { // If the current value is a number or an opening parenthesis, push it to the corresponding opStack/array.
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
    const num2 = parseFloat(stack.pop());
    const num1 = parseFloat(stack.pop());
    switch (op) {
      case "^":
        stack.push(num1 ** num2);
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
        stack.push(parseFloat(num1) + parseFloat(num2)); // REMEMBER + ON STRINGS WILL CONCAT THEM SO THEY MUST BE CONVERTED
        break;

      case "-":
        stack.push(num1 - num2);
        break;
    }
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
