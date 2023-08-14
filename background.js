let blockedSitesList;

// Fetch the stored URLs array from chrome.storage
chrome.storage.sync.get("blockedSites", function (data) {
  blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // Fetch the stored URLs array from chrome.storage
  chrome.storage.sync.get("blockedSites", function (data) {
    blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
  });

  if (blockedSitesList.indexOf(tab.url) != -1) {
    try {
      await chrome.scripting.insertCSS({
        target: {
          tabId: tabId,
        },
        files: ["blocked-style.css"],
      });
    } catch (err) {
      console.error(`failed to insert CSS: ${err}`);
    }
  }
});
