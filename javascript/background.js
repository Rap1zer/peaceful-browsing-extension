let blockedSitesList = [
  "www.epocrates.com",
  "www.everydayhealth.com",
  "www.healthline.com",
  "www.mayoclinic.org",
  "www.medicinenet.com",
  "www.medlineplus.gov",
  "www.medpagetoday.com",
  "www.medscape.com",
  "www.msdmanuals.com",
  "www.nih.gov",
  "www.nhsinform.scot",
  "openmd.com",
  "www.rxlist.com",
  "www.cdc.gov",
  "www.wolterskluwer.com",
  "www.uptodate.com",
  "www.webmd.com",
  "my.clevelandclinic.org",
  "www.nhs.uk",
];

let isBlockerPaused = false;
let keywordData;
fetchJsonData();

// chrome.storage.sync.clear();
// chrome.storage.sync.set({ isBlockerPaused: false });
// chrome.storage.sync.set({ blockedSites: blockedSitesList });

async function fetchJsonData() {
  try {
    const response = await fetch("../medicinenet-diseases.json");
    const data = await response.json();
    keywordData = data.map((entry) => entry.disease.toLowerCase());
    //keywordData = new Set(data.map((entry) => entry.disease));
    console.log(keywordData);
    //chrome.storage.sync.set({ blockedKeywords: keywordData });
  } catch (error) {
    console.error("Error fetching JSON data:", error);
    throw error;
  }
}

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // Fetch the stored URLs array from chrome.storage
  await chrome.storage.sync.get("blockedSites", function (data) {
    blockedSitesList = data.blockedSites; // Use the retrieved array or an empty array
  });

  // Check if the chrome extension is currently paused
  await chrome.storage.sync.get("isBlockerPaused", function (data) {
    isBlockerPaused = data.isBlockerPaused;
  });

  const activeURL = new URL(tab.url);
  // Checks if the site is among the list of blocked webistes
  if (
    isBlockedSite(activeURL.origin + activeURL.pathname) &&
    isBlockerPaused === false
  ) {
    console.log("is a blocked website");
    try {
      await chrome.scripting.insertCSS({
        target: {
          tabId: tabId,
        },
        files: ["styling/blocked-style.css"],
      });
    } catch (err) {
      console.error(`failed to insert CSS: ${err}`);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // All asynchronous messages are handled in this anonymous function
  (async () => {
    console.log(message.type);
    //Check if the chrome extension is currently paused
    await chrome.storage.sync.get("isBlockerPaused", function (data) {
      isBlockerPaused = data.isBlockerPaused;
    });

    // Insert CSS into a webpage
    if (message.type === "insertCSS" && isBlockerPaused === false) {
      console.log("Sent from tab:", sender.tab);
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      try {
        chrome.scripting.insertCSS({
          target: {
            tabId: activeTab.id,
          },
          files: ["styling/blocked-style.css"],
        });
      } catch (err) {
        console.error(`failed to insert CSS: ${err}`);
      }
    } else if (message.type === "removeCSS") {
      // Remove CSS from a webpage
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      try {
        chrome.scripting.removeCSS({
          target: {
            tabId: activeTab.id,
          },
          files: ["styling/blocked-style.css"],
        });
      } catch (err) {
        console.error(`failed to remove CSS: ${err}`);
      }
    }
  })();

  if (message.data === "fetchBlockedKeywords") {
    sendResponse(keywordData);
  }
});

// Check if site is in the list of blocked sites
function isBlockedSite(url) {
  return blockedSitesList.some((site) => url.includes(site));
}

chrome.storage.sync.get("blockedSites", function (data) {
  blockedSitesList = data.blockedSites; // Use the retrieved array or an empty array
});
