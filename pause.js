const pauseBlockerBtn = document.getElementById("pause-blocker-btn");
chrome.storage.sync.get("isBlockerPaused", function (data) {
  data.isBlockerPaused
    ? (pauseBlockerBtn.innerText = "Blocker paused")
    : (pauseBlockerBtn.innerText = "Pause health anxiety blocker");
});

document.getElementById("pause-once-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "removeCSS" });
});

pauseBlockerBtn.addEventListener("click", async () => {
  await chrome.storage.sync.get("isBlockerPaused", function (data) {
    // This chrome extension is paused. Unpause it
    if (data.isBlockerPaused === true) {
      pauseBlockerBtn.innerText = "Pause health anxiety blocker";
      chrome.storage.sync.set({ isBlockerPaused: false });
      chrome.runtime.sendMessage({ type: "insertCSS" });
    } else {
      // This chrome extension is not paused. Pause it.
      pauseBlockerBtn.innerText = "Blocker paused";
      chrome.storage.sync.set({ isBlockerPaused: true });
      chrome.runtime.sendMessage({ type: "removeCSS" });
    }
  });

  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  chrome.tabs.reload(activeTab.id);
});
