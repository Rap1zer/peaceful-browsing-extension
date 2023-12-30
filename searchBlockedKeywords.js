const blockedKeywordsUl = document.getElementById("blocked-list");
let blockedKeywords = [];

// Listen for button clicks
document.addEventListener("click", (e) => {
  // If the clicked button is a trash button.
  if (e.target.id.endsWith("-blocked-keyword")) {
    console.log("hi");
    // Find the index of the keyword the user wants to delete.
    const regex = /^(\d+)-blocked-keyword$/;
    const index = e.target.id.match(regex)[1];

    // Remove the keyword from the blocked sites array
    blockedKeywords.splice(index, 1);
    chrome.storage.sync.set({ blockedKeywords: blockedKeywords });
    loadblockedKeywords();
  }
});

function loadblockedKeywords() {
  blockedKeywordsUl.innerHTML = "";

  // Fetch the blocked keywords array from chrome.storage
  chrome.storage.sync.get("blockedKeywords", function (data) {
    blockedKeywords = data.blockedKeywords;
    // Add the first 10 blocked keywords into a list
    for (let i = 0; i < Math.min(10, blockedKeywords.length); i++) {
      blockedKeywordsUl.innerHTML += `<li>${blockedKeywords[i]} <button id="${i}-blocked-keyword"><i class="fa-solid fa-trash" id="${i}-blocked-keyword"></i></button> </li>`;
    }
  });
}

loadblockedKeywords();
