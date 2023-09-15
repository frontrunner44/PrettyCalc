/*
The calculation method is to first convert the prefix equation into a postfixed equation and then run a stack-based algorithm to calculate the equation result.
Shunting-Yard algorithms typically take two pass-throughs, one to convert to postfix and the second to run a stack algorithm for calculation. My approach performs both in a single pass-through.

In order to do this properly, we need the array to be formatted in the correct way. We need each number (even if it has decimal places) to take up their own index, as well as each operator and parenthesis. 
However, to make checking for proper equation design easier, we have to have a slight difference in the array format, which is allowing decimals to take their own index rather than being grouped with their respective integers.
Because of this, we have to manipulate the equation array at various locations in various different ways depending on the requirements at the time. For example, when checking if it's okay to add a decimal,
we need all decimals to take up their own index so we can get their values with lastIndexOf() and compare that to the lastIndexOf() of any operators or parenthesis. 
We know if a decimal is found later than any other operator or parenthesis, we can't add a decimal because that means the number we're currently working with already has a decimal.
*/

const operators = ["+", "-", "*", "/", "^"];
let equation = []; // Stores the user's input in an array as inputs are added. Makes it easier to clear by popping the array and rewriting it with innerHTML.

function handleNumber(num) {
  const lastIndex = equation.length - 1;
  if(equation[lastIndex] === ")") {
    equation.push("*");
    equation.push(num);
  } else if(!isNaN(equation[lastIndex])) {
    equation[lastIndex] += num.toString();
  } else if(equation[lastIndex] === ".") {
    equation[lastIndex] = equation[lastIndex - 1] + equation[lastIndex] + num.toString(); // We store "." in its own index for better calculator safety checks, but we need to be inside of the same index as its respective integers for proper calculation later.
    equation.splice(lastIndex - 1, 1); // After combining the last two indexes with the newly added integer, we remove the second-to-last index.
  } else {
    equation.push(num);
  }
  updatePreview();
}

function handleParenthesis() {
  const lastIndex = equation.length - 1;
  let openPara = 0;
  let closePara = 0;
  // for loop here that loops through the equation array and counts the instances of "(" and ")"
  for(let i = 0; i < equation.length; i++) {
    if(equation[i] === "(") {
      openPara++;
    } else if(equation[i] === ")") {
      closePara++;
    }
  }
  if(!isNaN(equation[lastIndex]) || equation[lastIndex] === ")") { // If the last index is a number or closing parenthesis
    if(openPara > closePara) {
      equation.push(")");
    } else {
      equation.push("*");
      equation.push("(");
    }
  } else if(equation[lastIndex] === "(" || operators.indexOf(equation[lastIndex]) !== -1 || equation.length === 0) { // If the last index is a "(", an operator or the equation array is empty.
    equation.push("(");
  }
  updatePreview();
}

function handleOperator(op) {
  const lastIndex = equation.length - 1;
  if(equation[lastIndex] === "(" || equation[lastIndex] === "." || equation.length === 0) {
    return;
  } else if(operators.indexOf(equation[lastIndex]) !== -1) {
    equation.pop();
    equation.push(op);
  } else {
    equation.push(op);
  }
  updatePreview();
}

function handleDecimal() {
  const lastIndex = equation.length - 1;
  if(isNaN(equation[lastIndex])) {
    return;
  } else {
    let tempEquation = equation.join(""); // Sets a new array to equation after converting it to a string.
    console.log(`After becoming string ${tempEquation}`);
    tempEquation = tempEquation.split(/(?!$)/); // Converts the string back into an array, making sure "." takes up its own index. This is done to split the array in such a way that we can properly search for "." and operator indexes to see which appears last.
    console.log(`After becoming array ${tempEquation}`);
    const decimalIndex = tempEquation.lastIndexOf(".");
    let operatorIndex = 0;
    console.log(tempEquation);
    operators.forEach(op => {
      console.log(`Checking tempEquation for ${op}`);
      let indexCheck = tempEquation.lastIndexOf(op);
      console.log(`${op} found at index ${indexCheck}`);
      if(indexCheck > operatorIndex) {
        operatorIndex = indexCheck;
      }
    })
    if(operatorIndex > decimalIndex) { // We can only add another decimal if 
      equation.push(".");
    }
  }
  updatePreview();
}

function clearRecent() {
  equation.pop();
  updatePreview();
}

function updatePreview() {
  const element = document.getElementById("result");
  if(equation.length === 0) {
    element.innerHTML = "0";
  } else {
    element.innerHTML = equation.join("");
  }
}

function equalButton() {
  const lastIndex = equation.length - 1;
  let openPara = 0;
  let closePara = 0;
  for (let i = 0; i < equation.length; i++) {
    if(equation[i] === "(") {
      openPara++;
    } else if(equation[i] === ")") {
      closePara++;
    }
  }
  console.log(openPara);
  console.log(closePara);
  if(equation[lastIndex] === "(" || equation[lastIndex] === "." || operators.indexOf(equation[lastIndex]) !== -1 || openPara > closePara) {
    return;
  } else {
    const result = calculateInput(equation);
    const element = document.getElementById("result");
    element.innerHTML = result;
  }
}

function calculateInput(postFixThis) {
  let stack = [];
  let opStack = [];
  let postFixEquation = [];
  postFixThis.forEach(value => {
    if(operators.includes(value)) { // If the current index is an operator
      while (opEval(value) <= opEval(opStack[opStack.length - 1])) { // If the operator at the top of the opStack is equal or of higher importance. No need to check if it's empty because that will return -1.
        postFixEquation.push(opStack[opStack.length - 1]);
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
        postFixEquation.push(value);
      }
    } else if(value === ")") { // If the current value is a closing parenthesis, pop operators from the opStack onto the expression until an opening parenthesis is found
      while (operators.includes(opStack[opStack.length - 1])) { // While the top of the opStack is an operator (because if it isn't, it's an opening parenthesis)
        postFixEquation.push(opStack[opStack.length - 1]);
        stack.push(opStack.pop());
        runCalc();
      }
      opStack.pop(); // Remove ( from the stack
    }
  });
  while (opStack.length >= 1 || stack.length === 3) { // Finish popping any leftover operators from the operator opStack to the expression.
    if(operators.includes(stack[stack.length - 1])) {
      runCalc();
    } else {
      postFixEquation.push(opStack[opStack.length - 1]);
      stack.push(opStack.pop());
    }
  }
  console.log(`Finished post-fixed expression:${postFixEquation}`);
  console.log(`Result of calculation: ${stack[0]}`);
  equation = stack;
  return stack[0]; // Returns the result

  function runCalc() {
    let op = stack.pop();
    let num2 = parseFloat(stack.pop());
    let num1 = parseFloat(stack.pop());
    switch (op) {
      case "^":
        stack.push(num1 ** num2);
        break;
      case "*":
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
    } else if(op === "*" || op === "/") {
      return 2;
    } else if(op === "^") {
      return 3;
    } else {
      return -1;
    }
  }
}
