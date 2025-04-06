// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const tokenInput   = document.getElementById('tokenInput');
    const autoToggle   = document.getElementById('autoSubmitToggle');
    const notifyToggle = document.getElementById('notifyToggle');
    const leadValue    = document.getElementById('leadValue');
    const leadUnit     = document.getElementById('leadUnit');
    const saveBtn      = document.getElementById('save');
  
    // Load saved settings (or defaults)
    chrome.storage.sync.get(
      { canvasToken: '', autoSubmit: true, notify: true, submitTime: 5 },
      ({ canvasToken, autoSubmit, notify, submitTime }) => {
        tokenInput.value   = canvasToken;  // <-- user’s personal access token
        autoToggle.checked = autoSubmit;
        notifyToggle.checked = notify;
  
        // convert stored submitTime back into value+unit
        if (submitTime % 60 === 0) {
          leadValue.value = submitTime / 60;
          leadUnit.value  = 'hours';
        } else {
          leadValue.value = submitTime;
          leadUnit.value  = 'minutes';
        }
      }
    );
  
    saveBtn.addEventListener('click', () => {
      // Read and normalize lead time
      let val = parseInt(leadValue.value, 10);
      if (isNaN(val) || val < 1) val = 5;
      const unit = leadUnit.value;
      const submitTime = unit === 'hours' ? val * 60 : val;
  
      // Save all settings, including the personal access token
      chrome.storage.sync.set({
        canvasToken: tokenInput.value.trim(),  // <-- store token here
        autoSubmit: autoToggle.checked,
        notify:     notifyToggle.checked,
        submitTime
      }, () => {
        saveBtn.textContent = 'Saved!';
        setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
      });
    });
  });