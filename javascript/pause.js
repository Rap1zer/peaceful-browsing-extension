const pauseBlockerBtn = document.getElementById("pause-blocker-btn");
const pauseBlockerMsg = document.getElementById("pause-blocker-msg");

chrome.storage.sync.get("isBlockerPaused", function (data) {
  data.isBlockerPaused
    ? (pauseBlockerBtn.innerText = "Enable blocker")
    : (pauseBlockerBtn.innerText = "Disable blocker");
});

// Remove the CSS hiding the site when the "pause once" button is pressed
document.getElementById("pause-once-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "removeCSS" });
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

    pauseBlockerMsg.textContent = "reload page to see changes";
  });

  // const [activeTab] = await chrome.tabs.query({
  //   active: true,
  //   currentWindow: true,
  // });
  // chrome.tabs.reload(activeTab.id);
});
