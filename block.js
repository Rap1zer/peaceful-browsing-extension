const pathSlider = document.getElementById("path-slider");
const blockCustomSiteBtn = document.getElementById("block-custom-site");
const pagePathEl = document.getElementById("page-path");
let pathSegments = [];

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  // Create a URL object
  const url = new URL(tabs[0].url);
  // Filtered URL (excludes query string, fragment identifier, and any other components)
  const filteredUrl = new URL(url.origin + url.pathname);
  // Get the pathnames as an array
  pathSegments = filteredUrl.pathname.split("/").filter(Boolean);
  // Set the path slider
  pathSlider.max = pathSegments.length;
  pathSlider.value = pathSegments.length;

  pagePathEl.innerText = filteredUrl.toString();
});

blockCustomSiteBtn.addEventListener("click", () => {
  siteInput.value.trim();
  if (siteInput.value) {
    blockedSitesList.push(siteInput.value);
    chrome.storage.sync.set({ blockedSites: blockedSitesList });
    blockedUl.innerHTML += `<li>${siteInput.value}</li>`;
    siteInput.value = "";
  }
});
