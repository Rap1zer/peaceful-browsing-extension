const blockedUl = document.getElementById("blocked-list");
let blockedSitesList = [];

// Listen for button clicks
document.addEventListener("click", (e) => {
  // If the clicked button is a trash button.
  if (e.target.id.endsWith("-blocked-site")) {
    // Find the index of the site the user wants to delete.
    const regex = /^(\d+)-blocked-site$/;
    const index = e.target.id.match(regex)[1];

    // Remove the site from the blocked sites array
    blockedSitesList.splice(index, 1);
    chrome.storage.sync.set({ blockedSites: blockedSitesList });
    loadBlockedSites();
  }
});

function loadBlockedSites() {
  blockedUl.innerHTML = "";

  // Fetch the blocked sites array from chrome.storage
  chrome.storage.sync.get("blockedSites", function (data) {
    blockedSitesList = data.blockedSites;
    // Add every blocked site into a list
    for (let i = 0; i < blockedSitesList.length; i++) {
      blockedUl.innerHTML += `<li>${blockedSitesList[i]} <button id="${i}-blocked-site"><i class="fa-solid fa-trash" id="${i}-blocked-site"></i></button> </li>`;
    }
  });
}

loadBlockedSites();
