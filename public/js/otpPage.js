const inputFields = document.querySelectorAll("input.field");

inputFields.forEach((field) => {
  field.addEventListener("input", handleInput);
  field.addEventListener("keydown", handleBackspace);
});

function handleInput(e) {
  let inputField = e.target;
  if (inputField.value.length >= 1) {
    let nextField = inputField.nextElementSibling;
    return nextField && nextField.focus();
  }
}

function handleBackspace(e) {
 
  if (e.key === "Backspace" || e.key === "Delete") {
      let inputField = e.target;
   
      if (inputField.value.length === 0) {
          let previousField = inputField.previousElementSibling;
          if (previousField && previousField.tagName === "INPUT") {
              previousField.focus();
           
              previousField.value = '';
          }
      }
  }
}
