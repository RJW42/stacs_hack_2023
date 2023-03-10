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

    navigator.clipboard.writeText(selection)
      .then(() => console.log("Done"))
      .catch((error) => console.error(error));

    // popup_data({
    //   choices: [{
    //     message: {
    //       content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus imperdiet metus nec tellus feugiat lobortis. In massa tellus, congue quis ex at, tincidunt rutrum diam. Curabitur hendrerit turpis id ante feugiat, a luctus magna congue. Phasellus consequat fermentum imperdiet. Donec maximus ipsum tellus, sit amet lobortis nunc vehicula quis. Duis finibus, sapien non auctor pharetra, arcu nisi varius neque, vel malesuada orci mi vel mauris. Donec quis consequat magna. "
    //     }
    // }]
    // });
    
    // Send the selected text to the ChatGPT API
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer API_KEY_HERE"
      },
      body: JSON.stringify({
          "model": "gpt-3.5-turbo",
          "messages": [{"role": "system", "content": "You will be provided with a code snippet. Please respond with the language you think the code is written in, a summary of what the code does, and the predicted output if applicable. Your response should consist of three distinct and clear sections: Language, Summary, and Output. The output section should be a code block containing an example output of the code snippet."},
          {"role": "user", "content": selection }],
          "temperature": 0.7,
          "n": 1,
          "stop": ["."]
      })
    })
    .then(response => response.json())
    .then(data => {
      popup_data(data)
    })
    .catch(error => {
      console.error("API call failed:", error);
    });
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


    popup = window.open("", "Summary", "width=400,height=600");
    
    popup.document.body.innerHTML = `
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');

    body {
        background-color: #D1DBD9;
        color: #1E1E24;
        font-family: 'Roboto', sans-serif;
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
      cursor: pointer;
      display: inline-block;
  }

  .container button:active {
      background-color: #71716F;
  }
  </style>
  <body>
  <div class="container">
      <h1>How do Code?</h1>
      <div>
      ${data.choices[0].message.content}
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

    // popup.document.getElementById("copy-button").addEventListener("click", function() {
    //   console.log("test");
    //   navigator.clipboard.writeText(text)
    //     .then(() => console.log("Done"))
    //     .catch((error) => console.error(error));
    // });
  }
});
