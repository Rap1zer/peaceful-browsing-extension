const pauseBlockerBtn = document.getElementById("pause-blocker-btn") as HTMLButtonElement | null;
if (!pauseBlockerBtn) throw new Error("Pause blocker button not found");

chrome.storage.sync.get("isBlockerPaused", function (data) {
  pauseBlockerBtn.innerText = data.isBlockerPaused ? "Enable blocker" : "Disable blocker";
});

// Enable or disable the chrome extension
pauseBlockerBtn.addEventListener("click", () => {
  chrome.storage.sync.get("isBlockerPaused", function (data: { isBlockerPaused?: boolean }) {
    // This chrome extension is paused. Unpause it
    if (data.isBlockerPaused) {
      pauseBlockerBtn.innerText = "Disable blocker";
      chrome.storage.sync.set({ isBlockerPaused: false });
    } else {
      // This chrome extension is not paused. Pause it.
      pauseBlockerBtn.innerText = "Enable blocker";
      chrome.storage.sync.set({ isBlockerPaused: true });
    }

    const pauseMsg = document.getElementById("pause-blocker-msg");
    if (pauseMsg) pauseMsg.textContent = "Reload page to see changes";
  });
});
