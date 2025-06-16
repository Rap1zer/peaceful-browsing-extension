const pauseBlockerBtn = document.getElementById("pause-blocker-btn");
//const pauseOnceBtn = document.getElementById("pause-once-btn");
let isBlockedSite = false;

chrome.storage.sync.get("isBlockerPaused", function (data) {
  data.isBlockerPaused
    ? (pauseBlockerBtn.innerText = "Enable blocker")
    : (pauseBlockerBtn.innerText = "Disable blocker");
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
      "Reload page to see changes";
  });
});
