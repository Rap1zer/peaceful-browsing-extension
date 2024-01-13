const keywordInput = document.getElementById("new-keyword-input");
const blockKeywordBtn = document.getElementById("block-new-keyword-btn");

blockKeywordBtn.addEventListener("click", () => {
  // Do not block keyword if the keyword input field is empty (there is no keyword)
  if (!keywordInput.value.trim()) {
    return;
  }

  // Fetch blocked keywords from background.js and add the keyword to the set
  chrome.runtime.sendMessage(
    { data: "fetchBlockedKeywords" },
    function (blockedKeywords) {
      const keyword = keywordInput.value.trim().toLowerCase();

      //Do not add keyword to list if keyword is already in list.
      if (blockedKeywords.includes(keyword)) {
        // Return to main page
        window.location.href = "../main.html";
        return;
      }

      // Push the new keyword into the list of blocked keywords.
      blockedKeywords.push(keyword);

      // Return to main page
      window.location.href = "../main.html";
    }
  );
});
