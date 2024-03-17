const pauseBlockerBtn = document.getElementById("pause-blocker-btn");
const pauseOnceBtn = document.getElementById("pause-once-btn");
let isBlockedSite = false;

// Display the pause button if the active tab is blocked (pause button allows the webpage to be temporarily unblocked)
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(tabs[0].id, { type: "isBlocked" }, (response) => {
    if (response.isBlocked) pauseOnceBtn.style.display = "block";
  });
});

chrome.storage.sync.get("isBlockerPaused", function (data) {
  data.isBlockerPaused
    ? (pauseBlockerBtn.innerText = "Enable blocker")
    : (pauseBlockerBtn.innerText = "Disable blocker");
});

// Remove the CSS blurring the site when the "pause once" button is pressed
pauseOnceBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.runtime.sendMessage({ tabId: tabs[0].id, type: "removeCSS" });
  });
});

// Disable or enable the chrome extension
pauseBlockerBtn.addEventListener("click", async () => {
  await chrome.storage.sync.get("isBlockerPaused", function (data) {
    // This chrome extension is paused. Unpause it
    if (data.isBlockerPaused) {
      pauseBlockerBtn.innerText = "Disable blocker";
      chrome.storage.sync.set({ isBlockerPaused: false });
    } else {
      // This chrome extension is not paused. Pause it.
      pauseBlockerBtn.innerText = "Enable blocker";
      chrome.storage.sync.set({ isBlockerPaused: true });
    }

    document.getElementById("pause-blocker-msg").textContent =
      "reload page to see changes";
  });
});
