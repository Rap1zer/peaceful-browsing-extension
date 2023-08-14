const siteInput = document.getElementById("site-input");
const blockBtn = document.getElementById("block-btn");
const blockedUl = document.getElementById("blocked-list");
let blockedSitesList = [];

// Fetch the stored URLs array from chrome.storage
chrome.storage.sync.get("blockedSites", function (data) {
  blockedSitesList = data.blockedSites || []; // Use the retrieved array or an empty array
  for (site of blockedSitesList) {
    blockedUl.innerHTML += `<li>${site}</li>`;
  }
});

blockBtn.addEventListener("click", () => {
  siteInput.value.trim();
  if (siteInput.value) {
    blockedSitesList.push(siteInput.value);
    chrome.storage.sync.set({ blockedSites: blockedSitesList });
    blockedUl.innerHTML += `<li>${siteInput.value}</li>`;
    siteInput.value = "";
  }
});
