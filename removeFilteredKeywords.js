const filteredKeywordsUl = document.getElementById("blocked-list");
let filteredKeywords = [];

// Listen for button clicks
document.addEventListener("click", (e) => {
  // If the clicked button is a trash button.
  if (e.target.id.endsWith("-filtered-keyword")) {
    console.log("hi");
    // Find the index of the keyword the user wants to delete.
    const regex = /^(\d+)-filtered-keyword$/;
    const index = e.target.id.match(regex)[1];

    // Remove the keyword from the blocked sites array
    filteredKeywords.splice(index, 1);
    chrome.storage.sync.set({ filteredKeywords: filteredKeywords });
    loadFilteredKeywords();
  }
});

function loadFilteredKeywords() {
  filteredKeywordsUl.innerHTML = "";

  // Fetch the filtered keywords array from chrome.storage
  chrome.storage.sync.get("filteredKeywords", function (data) {
    filteredKeywords = data.filteredKeywords;
    // Add the first 10 filtered keywords into a list
    for (let i = 0; i < Math.min(10, filteredKeywords.length); i++) {
      filteredKeywordsUl.innerHTML += `<li>${filteredKeywords[i]} <button id="${i}-filtered-keyword"><i class="fa-solid fa-trash" id="${i}-filtered-keyword"></i></button> </li>`;
    }
  });
}

loadFilteredKeywords();
