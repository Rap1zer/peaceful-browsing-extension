const keywordInput = document.getElementById("new-keyword-input");
const blockKeywordBtn = document.getElementById("block-new-keyword-btn");

blockKeywordBtn.addEventListener("click", () => {
  // Do not block keyword if the keyword input field is empty (there is no keyword)
  if (!keywordInput.value.trim()) {
    return;
  }

  // Get the blocked keywords from storage.
  chrome.storage.sync.get("blockedKeywords", function (data) {
    const keyword = keywordInput.value.trim().toLowerCase();

    //Do not add keyword to list if keyword is already in list.
    if (data.blockedKeywords.includes(keyword)) {
      return;
    }

    // Push the new keyword into the list of blocked keywords.
    data.blockedKeywords.push(keyword);
    console.log(data.blockedKeywords);
    // Update the chrome storage
    chrome.storage.sync.set({ blockedKeywords: data.blockedKeywords });
    // Return to main page
    window.location.href = "../main.html";
  });
});
