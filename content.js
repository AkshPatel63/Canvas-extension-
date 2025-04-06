
console.log("📦 Canvas Auto‑Submit Content Script Loaded");

// Load settings, with sensible defaults
chrome.storage.sync.get(
  { autoSubmit: true, canvasToken: "", submitTime: 5, notify: true },
  (settings) => {
    console.log("🔍 Settings loaded from chrome.storage.sync:", settings);
    const { autoSubmit, canvasToken, submitTime, notify } = settings;

    if (!autoSubmit || !canvasToken) {
      console.warn("⚠️ Auto‑submit is disabled or no token is stored.");
      return;
    }

    // Extract courseId & assignmentId from the URL
    const pathMatch = window.location.pathname.match(/\/courses\/(\d+)\/assignments\/(\d+)/);
    if (!pathMatch) {
      console.warn("❌ Not on an assignment page.");
      return;
    }
    const [_, courseId, assignmentId] = pathMatch;
    console.log("📘 Course ID:", courseId, "📝 Assignment ID:", assignmentId);

    // Build the API endpoint using the current host
    const API = `${window.location.origin}/api/v1/courses/${courseId}/assignments/${assignmentId}`;

    // Fetch assignment details
    fetch(API, {
      headers: { Authorization: `Bearer ${canvasToken}` }
    })
      .then(response => {
        console.log("🔗 Canvas API responded with status:", response.status);
        if (response.status === 401) throw new Error("Unauthorized (401) — Token may be invalid");
        return response.json();
      })
      .then(data => {
        console.log("📦 Assignment data received:", data);

        // 1) Parse the UTC timestamp
        let dueDate = new Date(data.due_at);
        console.log("Due at (parsed):", dueDate.toLocaleString());

        // 2) DST adjustment hack:
        //    Compare the parsed date's offset to the "standard" offset for this locale/year.
        const year = dueDate.getFullYear();
        const stdOffset = Math.max(
          new Date(year, 0, 1).getTimezoneOffset(),
          new Date(year, 6, 1).getTimezoneOffset()
        );
        if (dueDate.getTimezoneOffset() < stdOffset) {
          // We’re in DST but Canvas gave us a standard‑time value, so bump +1h
          dueDate = new Date(dueDate.getTime() + 60 * 60 * 1000);
          console.log("⏱️ Adjusted for DST:", dueDate.toLocaleString());
        }

        // 3) Calculate when to fire the alarm
        const submitTimeMs = submitTime * 60 * 1000;
        const when = dueDate.getTime() - submitTimeMs;
        if (isNaN(when)) {
          console.error("❌ Could not calculate submit time from due date.");
          return;
        }

        console.log(`📅 Scheduling auto-submit for: courses/${courseId}/assignments/${assignmentId}`);
        console.log("⏰ Will submit at:", new Date(when).toLocaleString());

        // 4) Send message to background to schedule the alarm
        chrome.runtime.sendMessage({
          action: "scheduleSubmit",
          when,
          courseId,
          assignmentId,
          notify
        });
      })
      .catch(err => {
        console.error("❌ Error fetching assignment or scheduling submit:", err);
      });
  }
);
