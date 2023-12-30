const pathSlider = document.getElementById("path-slider");
const blockCustomSiteBtn = document.getElementById("block-custom-site");
const siteInput = document.getElementById("site-input");
const blockThisSiteBtn = document.getElementById("block-this-site");
const searchSitePageBtn = document.getElementById("search-blocked-sites-btn");
const pagePathEl = document.getElementById("page-path"); // Displays the path of the webpage
let url;
let pathSegments = [];

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  // Create a URL object
  url = new URL(tabs[0].url);
  // Get the path segments in the path name as an array
  pathSegments = url.pathname.split("/").filter(Boolean);
  // Set the path slider
  pathSlider.max = pathSegments.length;
  pathSlider.value = pathSegments.length;

  // Update page path elemetn with the path of the page
  pagePathEl.innerText = url.hostname + url.pathname;
});

blockThisSiteBtn.addEventListener("click", async () => {
  // Use Chrome storage API to get the current list of blocked sites.
  await chrome.storage.sync.get("blockedSites", async function (data) {
    // Extract the 'blockedSites' array from the data.
    let blockedSites = data.blockedSites;

    // Check if the current page's path (innerText of 'pagePathEl') is not already in the blocked sites list.
    if (!blockedSites.includes(pagePathEl.innerText)) {
      // If not, add the current page's path to the blocked sites list.
      blockedSites.push(pagePathEl.innerText);
      // Use Chrome storage API to save the updated blocked sites list.
      await chrome.storage.sync.set({ blockedSites: blockedSites });
    }
  });

  // Redirect the current page to "main.html".
  window.location.href = "main.html";
  // Reload the active tab
  chrome.tabs.reload();
});

pathSlider.addEventListener("input", () => {
  pagePathEl.innerText = url.hostname;
  for (let i = 0; i < pathSlider.value; i++) {
    pagePathEl.innerText += pathSegments[i] + "/";
  }
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

searchSitePageBtn.addEventListener("click", () => {
  window.location.href = "search-blocked-sites.html";
});
