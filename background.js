let blockedSitesList = [
  "www.epocrates.com",
  "www.everydayhealth.com",
  "www.healthline.com",
  "www.mayoclinic.org",
  "www.medicinenet.com",
  "medlineplus.gov",
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
  //"www.nhs.uk",
];

//chrome.storage.sync.clear();
//chrome.storage.sync.set({ blockedSites: blockedSitesList });

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // Fetch the stored URLs array from chrome.storage
  retrieveBlockedSites();

  const hostName = new URL(tab.url).hostname;
  if (blockedSitesList.indexOf(hostName) != -1) {
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

// // Fetch the stored URLs array from chrome.storage
function retrieveBlockedSites() {
  chrome.storage.sync.get("blockedSites", function (data) {
    blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
  });
}

retrieveBlockedSites();
