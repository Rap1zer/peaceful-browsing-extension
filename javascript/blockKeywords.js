const keywordInput = document.getElementById("new-keyword-input");
const blockKeywordBtn = document.getElementById("block-new-keyword-btn");
console.log("hi");
blockKeywordBtn.addEventListener("click", () => {
  console.log("clicked");
  // Do not block keyword if the keyword input field is empty (there is no keyword)
  if (!keywordInput.value.trim()) {
    return;
  }
  // Fetch blocked keywords from background.js and add the keyword to the array
  chrome.storage.local.get("keywords", function (keywords) {
    keywords = keywords.keywords;
    const keyword = keywordInput.value.trim().toLowerCase();

    //Do not add keyword to list if keyword is already in list.
    if (keywords.includes(keyword)) {
      window.location.href = "../main.html";
      return;
    }

    // Push the new keyword into the list of blocked keywords.
    chrome.runtime.sendMessage({ type: "blockKeyword", keyword: keyword });

    window.location.href = "../main.html";
  });
});
