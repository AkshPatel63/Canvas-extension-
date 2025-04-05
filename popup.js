document.addEventListener('DOMContentLoaded', () => {
    const autoToggle   = document.getElementById('autoSubmitToggle');
    const notifyToggle = document.getElementById('notifyToggle');
    const leadValue    = document.getElementById('leadValue');
    const leadUnit     = document.getElementById('leadUnit');
    const saveBtn      = document.getElementById('save');
  
    // Load saved settings (or defaults)
    chrome.storage.sync.get(
      { autoSubmit: true, notify: true, submitTime: 5 },
      ({ autoSubmit, notify, submitTime }) => {
        autoToggle.checked   = autoSubmit;
        notifyToggle.checked = notify;
  
        // convert stored submitTime (in minutes) back into value+unit
        if (submitTime % 60 === 0) {
          leadValue.value = submitTime / 60;
          leadUnit.value  = 'hours';
        } else {
          leadValue.value = submitTime;
          leadUnit.value  = 'minutes';
        }
      }
    );
  
    // Save settings when user clicks “Save”
    saveBtn.addEventListener('click', () => {
      // read the value and unit, convert to minutes
      let val = parseInt(leadValue.value, 10);
      if (isNaN(val) || val < 1) val = 5;
      const unit = leadUnit.value;
      const submitTime = unit === 'hours' ? val * 60 : val;
  
      const settings = {
        autoSubmit: autoToggle.checked,
        notify:     notifyToggle.checked,
        submitTime
      };
  
      chrome.storage.sync.set(settings, () => {
        saveBtn.textContent = 'Saved!';
        setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
      });
    });
  });
  