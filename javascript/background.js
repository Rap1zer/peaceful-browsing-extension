let stylingForBlockedSites = "styling/blocked-style.css";

let blockedHostnames = [
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
// chrome.storage.sync.set({ blockedSites: blockedHostnames });

async function fetchJsonData() {
  try {
    // let newKeywordData = [];
    const response = await fetch("../medicinenet-diseases.json");
    keywordData = await response.json();
    // newKeywordData = keywordData.filter((keyword, index) => {
    // });
    // console.log(newKeywordData);
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // All asynchronous messages are handled in this anonymous function
  (async () => {
    //Check if the chrome extension is currently paused
    await chrome.storage.sync.get("isBlockerPaused", function (data) {
      isBlockerPaused = data.isBlockerPaused;
    });

    // Insert CSS into a webpage
    if (message.type === "insertCSS" && isBlockerPaused === false) {
      console.log("Sent from tab:", sender.tab);
      const [activeTab] = await getActiveTab();

      // Try to insert CSS
      try {
        chrome.scripting.insertCSS({
          target: {
            tabId: activeTab.id,
          },
          files: [stylingForBlockedSites],
        });
      } catch (err) {
        console.error(`failed to insert CSS: ${err}`);
      }
    } else if (message.type === "removeCSS") {
      // Remove CSS from a webpage
      const [activeTab] = await getActiveTab();

      // Try to remove CSS
      try {
        chrome.scripting.removeCSS({
          target: {
            tabId: activeTab.id,
          },
          files: [stylingForBlockedSites],
        });
      } catch (err) {
        console.error(`failed to remove CSS: ${err}`);
      }
    } else if (
      message.type === "checkIfHostnameIsBlocked" &&
      isBlockerPaused === false
    ) {
      // Fetch the stored URLs array from chrome.storage
      await chrome.storage.sync.get("blockedSites", function (data) {
        blockedHostnames = data.blockedSites; // Use the retrieved array or an empty array
      });

      const activeURL = new URL(message.data);
      // Checks if the site is among the list of blocked webistes
      if (
        blockedHostnames.includes(activeURL.hostname) &&
        isBlockerPaused === false
      ) {
        console.log("is a blocked website: " + activeURL.hostname);
        const [activeTab] = await getActiveTab();

        // Try to insert CSS
        try {
          chrome.scripting.insertCSS({
            target: {
              tabId: activeTab.id,
            },
            files: [stylingForBlockedSites],
          });
        } catch (err) {
          console.error(`failed to insert CSS: ${err}`);
        }
      }
    }
  })();

  if (message.type === "fetchBlockedKeywords") {
    sendResponse(keywordData);
  }
});

// Get the currently active tab
async function getActiveTab() {
  return ([activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  }));
}

chrome.storage.sync.get("blockedSites", function (data) {
  blockedHostnames = data.blockedSites; // Use the retrieved array or an empty array
});
