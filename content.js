// Define a variable to store a reference to the popup window
let popup = null;

let selection_record = null;

// Listen for text selection
document.addEventListener("mouseup", function() {
    // Get the selected text
    const selection = window.getSelection().toString();
  
    // Check that the selection is not empty
    if (selection && selection != selection_record) {
        selection_record = selection;
      // Send the selected text to the ChatGPT API
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer API_KEY_HERE"
        },
        body: JSON.stringify({
            "model": "gpt-3.5-turbo",
            "messages": [{"role": "system", "content": "You will be provided with a code snippet. Please respond with the language you think the code is written in, a summary of what the code does, and the predicted output if applicable."},
                         {"role": "user", "content": selection }],
            "temperature": 0.7,
            "n": 1,
            "stop": ["."]
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log(data)
        // Check that the response contains valid data
        if (data && data.choices && data.choices.length > 0) {
          // Check if the popup window already exists
          if (popup && !popup.closed) {
            // Update the content of the existing popup
            // popup.document.body.innerHTML = `<p>${data.choices[0].text}</p>`;
          } else {
            // Create a new popup window
            popup = window.open("", "Summary", "width=300,height=200");
  
            // Set the HTML content of the popup window
            popup.document.body.innerHTML = `<p>${data.choices[0].message.content}</p>`;
  
            // Listen for the popup window to be closed
            popup.addEventListener("beforeunload", function() {
              // Set the popup variable to null to indicate that it has been closed
              popup = null;
            });
          }
        } else {
          console.error("Invalid response from API:", data);
        }
      })
      .catch(error => {
        console.error("API call failed:", error);
      });
    }
  });

