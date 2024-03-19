let stylingForBlockedSites = "styling/blocked-style.css";
let isBlockerPaused = false;
//chrome.storage.local.clear();
chrome.storage.local.get("keywords", function (data) {
  if (!data.keywords) initialise();
});

async function initialise() {
  chrome.storage.sync.set({ isBlockerPaused: false });
  // Fetch keywords from JSON file and store it in local storage
  try {
    const response = await fetch("../medicinenet-diseases.json");
    const keywordData = await response.json();
    chrome.storage.local.set({ keywords: keywordData });
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  // All asynchronous messages are handled in this anonymous function
  (async () => {
    //Check if the chrome extension is currently paused
    await chrome.storage.sync.get("isBlockerPaused", function (data) {
      isBlockerPaused = data.isBlockerPaused;
    });

    // Insert CSS into a webpage
    if (message.type === "insertCSS" && isBlockerPaused === false) {
      // Insert CSS to blur website and add styling to the pop-up
      try {
        chrome.scripting.insertCSS({
          target: {
            tabId: sender.tab.id,
          },
          files: [stylingForBlockedSites],
        });
      } catch (err) {
        console.error(`failed to insert CSS: ${err}`);
      }
      // } else if (message.type === "removeCSS") { removed to follow Google's program policy
      //   // Remove CSS from the webpage to unblock it
      //   try {
      //     chrome.scripting.removeCSS({
      //       target: {
      //         tabId: message.tabId,
      //       },
      //       files: [stylingForBlockedSites],
      //     });
      //   } catch (err) {
      //     console.error(`failed to remove CSS: ${err}`);
      //   }
    }
  })();

  // Block a keyword and insert it into local storage
  if (message.type === "blockKeyword") {
    chrome.storage.local.get("keywords", function (result) {
      let keywordData = result.keywords;
      keywordData.push(message.keyword);
      chrome.storage.local.set({ keywords: keywordData });
    });
  }
});
