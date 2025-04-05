console.log("Canvas Auto‑Submit Extension Loaded");

let autoSubmitDone = false;

// this function will be called periodically to check for file upload and submit button
function checkAndAutoSubmit() {
  if (autoSubmitDone) return; // checks if we already auto-submitted in this session; prevents multiple submissions


  const fileInput    = document.querySelector('input[type="file"]');
  const submitButton = document.querySelector('button[type="submit"]');

  if (!fileInput || !submitButton) {
    console.log("File input or submit button not found.");
    return;
  }

  const fileUploaded      = fileInput.files.length > 0; // Check if a file has been uploaded
  
  const submitButtonReady = !submitButton.disabled && submitButton.offsetParent !== null;

  if (fileUploaded && submitButtonReady) {
    console.log("File uploaded and submit button active. Auto‑submitting…");
    submitButton.click();
    autoSubmitDone = true;

    // Silent background submission; no alert()
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Canvas Auto‑Submit",
      message: "✅ Assignment auto‑submitted in the background."
    });
  } else {
    console.log("No action needed yet.");
  }
}

// Check every 30 seconds
setInterval(checkAndAutoSubmit, 30000);
