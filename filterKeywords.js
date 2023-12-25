const keywordInput = document.getElementById("keyword-input");
const filterKeywordBtn = document.getElementById("filter-this-keyword-btn");

filterKeywordBtn.addEventListener("click", () => {
  // Do not filter keyword if the keyword input field is empty (there is no keyword)
  if (!keywordInput.value.trim()) {
    return;
  }

  // Get the filtered keywords from storage.
  chrome.storage.sync.get("filteredKeywords", function (data) {
    const keyword = keywordInput.value.trim().toLowerCase();

    // Do not add keyword to list if keyword is already in list.
    if (data.filteredKeywords.includes(keyword)) {
      return;
    }

    // Push the new keyword into the list of filtered keywords.
    data.filteredKeywords.push(keyword);
    console.log(data.filteredKeywords);
    // Update the chrome storage
    chrome.storage.sync.set({ filteredKeywords: data.filteredKeywords });
  });
});
