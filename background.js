


// background.js
console.log("Canvas Auto‑Submit Background Loaded");

//
// 1) Listen for scheduleSubmit messages from content.js
//
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "scheduleSubmit") {
    const alarmName = `courses/${msg.courseId}/assignments/${msg.assignmentId}`;
    const alarmTime = msg.when;

    console.log("📩 Received scheduleSubmit message:", msg);
    chrome.alarms.create(alarmName, { when: alarmTime });
    console.log("⏰ Alarm scheduled for:", new Date(alarmTime).toLocaleString());

    // Pull the token from sync storage
    chrome.storage.sync.get("canvasToken", ({ canvasToken }) => {
      if (!canvasToken) {
        console.error("❌ No Canvas token found in sync storage.");
        return;
      }
      // Save token + notify flag under this alarm name
      chrome.storage.local.set({
        [alarmName]: { token: canvasToken, notify: msg.notify }
      }, () => {
        console.log("✅ Stored token for:", alarmName);
      });
    });
  }
});

//
// 2) When the alarm fires, fetch submission & always submit
//
chrome.alarms.onAlarm.addListener((alarm) => {
  const alarmName = alarm.name;

  chrome.storage.local.get(alarmName, (items) => {
    const task = items[alarmName];
    if (!task || !task.token) {
      console.error("❌ No task/token found for alarm:", alarmName);
      return;
    }

    const { token, notify } = task;
    const match = alarmName.match(/courses\/(\d+)\/assignments\/(\d+)/);
    if (!match) {
      console.error("❌ Invalid alarm name format:", alarmName);
      return;
    }
    const [, courseId, assignmentId] = match;

    const BASE = "https://canvas.instructure.com/api/v1";
    const endpoint = `${BASE}/courses/${courseId}/assignments/${assignmentId}/submissions/self`;

    // 1) GET current submission (for logging/debug)
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        console.log("🔍 GET submission status:", res.status);
        return res.json();
      })
      .then(data => {
        console.log("📦 Submission object:", data);

        // 2) Always attempt the PUT to submit
        return fetch(endpoint, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ submission: { submission_type: "online_upload" } })
        });
      })
      .then(res => {
        if (res && res.ok) {
          console.log("✅ Auto‑submitted successfully!");
          if (notify) {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon48.png",
              title: "Canvas Auto‑Submit",
              message: "✅ Assignment auto‑submitted via API."
            });
          }
        } else if (res) {
          console.error("❌ Auto‑submit failed with status:", res.status);
        }
      })
      .catch(err => console.error("❌ Error during auto‑submit:", err));
  });
});





// testing 

// // background.js
// console.log("Canvas Auto‑Submit Background Loaded");

// //
// // 1) Listen for scheduleSubmit messages from content.js
// //
// chrome.runtime.onMessage.addListener((msg, sender) => {
//   if (msg.action === "scheduleSubmit") {
//     const alarmName = `courses/${msg.courseId}/assignments/${msg.assignmentId}`;
//     const alarmTime = msg.when;

//     console.log("📩 Received scheduleSubmit message:", msg);
//     chrome.alarms.create(alarmName, { when: alarmTime });
//     console.log("⏰ Alarm scheduled for:", new Date(alarmTime).toLocaleString());

//     // Pull the token from sync storage
//     chrome.storage.sync.get("canvasToken", ({ canvasToken }) => {
//       if (!canvasToken) {
//         console.error("❌ No Canvas token found in sync storage.");
//         return;
//       }
//       // Save token + notify flag under this alarm name
//       chrome.storage.local.set({
//         [alarmName]: { token: canvasToken, notify: msg.notify }
//       }, () => {
//         console.log("✅ Stored token for:", alarmName);
//       });
//     });
//   }
// });

// //
// // 2) When the alarm fires, attempt submission
// //
// chrome.alarms.onAlarm.addListener((alarm) => {
//   const alarmName = alarm.name;

//   chrome.storage.local.get(alarmName, (items) => {
//     const task = items[alarmName];
//     if (!task || !task.token) {
//       console.error("❌ No task/token found for alarm:", alarmName);
//       return;
//     }

//     const { token, notify } = task;
//     const match = alarmName.match(/courses\/(\d+)\/assignments\/(\d+)/);
//     if (!match) {
//       console.error("❌ Invalid alarm name format:", alarmName);
//       return;
//     }
//     const [, courseId, assignmentId] = match;

//     // Use the right base URL - this may need to be changed for custom Canvas instances
//     const BASE = "https://canvas.instructure.com/api/v1";
//     const submissionEndpoint = `${BASE}/courses/${courseId}/assignments/${assignmentId}/submissions/self`;

//     // 1) GET current submission (for logging/debug)
//     fetch(submissionEndpoint, {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//       .then(res => {
//         console.log("🔍 GET submission status:", res.status);
//         if (!res.ok) {
//           throw new Error(`Failed to fetch submission: ${res.status}`);
//         }
//         return res.json();
//       })
//       .then(data => {
//         console.log("📦 Submission object:", data);

//         // IMPORTANT CHANGE: Always attempt submission regardless of attachments
//         // Canvas API sometimes doesn't show attachments even when they exist
//         console.log("🔄 Proceeding with submission attempt regardless of attachment status");
        
//         // Use POST to the correct submissions endpoint
//         return fetch(`${BASE}/courses/${courseId}/assignments/${assignmentId}/submissions`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify({
//             submission: { 
//               submission_type: "online_upload"
//             }
//           })
//         });
//       })
//       .then(res => {
//         if (!res) {
//           return;
//         }
        
//         if (res.ok) {
//           console.log("✅ Auto‑submitted successfully!");
//           if (notify) {
//             chrome.notifications.create({
//               type: "basic",
//               iconUrl: "icons/icon48.png",
//               title: "Canvas Auto‑Submit",
//               message: "✅ Assignment auto‑submitted via API."
//             });
//           }
//           return;
//         }
        
//         console.error("❌ Auto‑submit failed with status:", res.status);
        
//         // Try an alternative endpoint if the first one fails
//         console.log("🔄 Trying alternative submission endpoint...");
//         return fetch(`${BASE}/courses/${courseId}/assignments/${assignmentId}/submissions/self`, {
//           method: "PUT",  // Use PUT for this endpoint
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify({
//             submission: { 
//               submission_type: "online_upload"
//             }
//           })
//         }).then(altRes => {
//           if (altRes.ok) {
//             console.log("✅ Auto‑submitted successfully via alternative endpoint!");
//             if (notify) {
//               chrome.notifications.create({
//                 type: "basic",
//                 iconUrl: "icons/icon48.png",
//                 title: "Canvas Auto‑Submit",
//                 message: "✅ Assignment auto‑submitted via API."
//               });
//             }
//           } else {
//             console.error("❌ Alternative submission also failed:", altRes.status);
//             return altRes.text().then(text => {
//               console.error("Error details:", text);
//               if (notify) {
//                 chrome.notifications.create({
//                   type: "basic",
//                   iconUrl: "icons/icon48.png",
//                   title: "Canvas Auto‑Submit",
//                   message: "❌ Could not submit assignment. Please submit manually."
//                 });
//               }
//             });
//           }
//         });
//       })
//       .catch(err => {
//         console.error("❌ Error during auto‑submit:", err);
//         if (notify) {
//           chrome.notifications.create({
//             type: "basic",
//             iconUrl: "icons/icon48.png",
//             title: "Canvas Auto‑Submit",
//             message: "❌ Error during submission. Please submit manually."
//           });
//         }
//       });
//   });
// });