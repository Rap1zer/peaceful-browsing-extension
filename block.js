const pathSlider = document.getElementById("path-slider");
const blockCustomSiteBtn = document.getElementById("block-custom-site");
const siteInput = document.getElementById("site-input");
const blockThisSiteBtn = document.getElementById("block-this-site");
const pagePathEl = document.getElementById("page-path");
let pathSegments = [];

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  // Create a URL object
  const url = new URL(tabs[0].url);
  // Get the pathnames as an array
  pathSegments = url.pathname.split("/").filter(Boolean);
  // Set the path slider
  pathSlider.max = pathSegments.length;
  pathSlider.value = pathSegments.length;

  pagePathEl.innerText = url.hostname + url.pathname;
});

blockThisSiteBtn.addEventListener("click", async () => {
  await chrome.storage.sync.get("blockedSites", async function (data) {
    let blockedSites = data.blockedSites;
    blockedSites.push(pagePathEl.innerText);
    await chrome.storage.sync.set({ blockedSites: blockedSites });
  });
});

blockCustomSiteBtn.addEventListener("click", async () => {
  siteInput.value.trim();
  if (siteInput.value) {
    await chrome.storage.sync.get("blockedSites", async function (data) {
      let blockedSites = data.blockedSites;
      blockedSites.push(siteInput.value);
      await chrome.storage.sync.set({ blockedSites: blockedSites });
    });
    siteInput.value = "";
  }
});
