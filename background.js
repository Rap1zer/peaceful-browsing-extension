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

//chrome.storage.sync.clear();
//chrome.storage.sync.set({ blockedSites: blockedSitesList });

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // Fetch the stored URLs array from chrome.storage
  await chrome.storage.sync.get("blockedSites", function (data) {
    blockedSitesList = data.blockedSites; // Use the retrieved array or an empty array
  });

  const activeURL = new URL(tab.url);
  if (isBlockedSite(activeURL.origin + activeURL.pathname)) {
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

// Check if site is in the list of blocked sites
function isBlockedSite(url) {
  return blockedSitesList.some((site) => url.includes(site));
}

chrome.storage.sync.get("blockedSites", function (data) {
  blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
});
