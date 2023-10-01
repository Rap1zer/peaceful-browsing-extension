const blockedUl = document.getElementById("blocked-list");
let blockedSitesList = [];

// Fetch the stored URLs array from chrome.storage
chrome.storage.sync.get("blockedSites", function (data) {
  blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
  for (site of blockedSitesList) {
    blockedUl.innerHTML += `<li>${site}</li>`;
  }
});
