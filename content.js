// Define a variable to store a reference to the popup window
let popup = null;

let selection_record = null;

// Listen for text selection
document.addEventListener("mouseup", function() {
    // Get the selected text
    const selection = window.getSelection().toString();

    if (!selection || selection === selection_record || selection.length < 10) {
      return;
    }
  
    selection_record = selection;

    popup_data({
      choices: [{text: "Hello wolrd this is some text"}]
    });

    // Send the selected text to the ChatGPT API
    // fetch("https://api.openai.com/v1/chat/completions", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": "Bearer API_KEY_HERE"
    //   },
    //   body: JSON.stringify({
    //       "model": "gpt-3.5-turbo",
    //       "messages": [{"role": "system", "content": "You will be provided with a code snippet. Please respond with the language you think the code is written in, a summary of what the code does, and the predicted output if applicable."},
    //                     {"role": "user", "content": selection }],
    //       "temperature": 0.7,
    //       "n": 1,
    //       "stop": ["."]
    //   })
    // })
    // .then(response => response.json())
    // .then(data => {
    //   popup_data(data)
    // })
    // .catch(error => {
    //   console.error("API call failed:", error);
    // });
  });



function popup_data(data) {
  if (!data || !data.choices || data.choices.length == 0) {
    console.error("Invalid response from API:", data);
    return;
  }

  if (popup && !popup.closed) {
    // Update the content of the existing popup
    // popup.document.body.innerHTML = `<p>${data.choices[0].text}</p>`;
    return;
  }


  popup = window.open("", "Summary", "width=400,height=800");
  
  popup.document.body.innerHTML = `
  <style>
  body {
    background-color: #D1DBD9;
    color: #1E1E24;
  }

  .container {
      display: flex;
      flex-direction: column;
      margin: 0 1em;
      height: 100%;
      box-sizing: content-box;
  }

  .container button {
      --border-color: #1E1E24;
      --border-width: 2px;
      --bottom-distance: 0px;

      margin-top: auto;
      padding: 0.5em 2em;
      font-size: 1.25em;
      background-color: inherit;
      font-weight: 600;
      border: none;
      border-bottom: var(--border-width) solid var(--border-color);
      align-self: center;

      display: inline-block;
      background-image: linear-gradient(var(--border-color), var(--border-color));
      background-size: 0% var(--border-width);
      background-repeat: no-repeat;
      transition: background-size 0.3s;
      background-position: 50% calc(100% - var(--bottom-distance));
  }

  .container button:hover {
      cursor: pointer;
      border-color: #D1DBD9;
      background-size: 100% var(--border-width);
  }
  </style>
  <body>
  <div class="container">
      <h1>Title</h1>
      <div>
      ${data.choices[0].text}
      </div>
      <button id="copy-button">Copy Code to Clipboard</button>
  </div>
  </body>  
`;

  // Listen for the popup window to be closed
  popup.addEventListener("beforeunload", function() {
    // Set the popup variable to null to indicate that it has been closed
    popup = null;
  });

  popup.document.getElementById("copy-button").addEventListener("click", function(event) {
    console.log("Click");
  });
}

