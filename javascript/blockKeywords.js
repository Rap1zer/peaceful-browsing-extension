const keywordInput = document.getElementById("new-keyword-input");
const searchKeywordInput = document.getElementById("keyword-search-input");
const blockKeywordMsg = document.getElementById("block-new-keyword-msg");
const blockKeywordBtn = document.getElementById("block-new-keyword-btn");
const keywordsList = document.getElementById("blocked-keywords-list");

blockKeywordBtn.addEventListener("click", () => {
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
      blockKeywordMsg.textContent =
        "word(s) are already in the list of trigger keywords";
      return;
    }

    if (keyword.length >= 50) {
      blockKeywordMsg.textContent = "input is too long";
      return;
    }
    // Push the new keyword into the list of blocked keywords.
    chrome.runtime.sendMessage({ type: "blockKeyword", keyword: keyword });
    blockKeywordMsg.textContent = `"${keyword}" is now blocked`;
  });
});

document.addEventListener("keydown", (event) => {
  chrome.storage.local.get("keywords", function (data) {
    const keywords = data.keywords;
    if (event.key === "Enter") {
      if (document.activeElement === searchKeywordInput) {
        let value = searchKeywordInput.value.toLowerCase().trim();
        if (!value) {
          keywordsList.innerHTML = "";
          return;
        }
        let results = [];
        for (let i = 0; i < keywords.length; i++) {
          if (keywords[i].includes(value)) {
            results.push(keywords[i]);
          }
        }

        if (results.length === 0) {
          keywordsList.innerHTML = `<p class="no-results-msg">No results</p>`;
        } else {
          loadResults(results);
        }
      }
    }
  });
});

function loadResults(keywords, length) {
  keywordsList.innerHTML = "";
  const index = length ? length : 0;
  const resultsLength = Math.min(50 + index, keywords.length);
  let colSwitch = true;
  for (let i = 0; i < resultsLength; i++) {
    const col = colSwitch ? "#f4f3ef" : "white";
    keywordsList.innerHTML += `
    <li class="block-keyword-item" style="background: ${col}">
      <p>${keywords[i]}</p>
      <button id="${keywords[i]}-keyword-item"><i class="fa-solid fa-lg fa-trash" id="${keywords[i]}-keyword-item"></i></button>
    </li>`;
    colSwitch = !colSwitch;
  }

  // If the end of the results has been reached, add a load more button
  if (resultsLength < keywords.length) {
    keywordsList.innerHTML += `
        <button class="load-more-btn" id="load-more-btn">Load more</button>`;

    document.getElementById("load-more-btn").addEventListener("click", () => {
      loadResults(keywords, resultsLength);
    });
  }
}

document.addEventListener("click", (e) => {
  // Delete / unblock a keyword
  if (e.target.id.includes("-keyword-item")) {
    const keyword = e.target.id.split("-")[0];
    chrome.storage.local.get("keywords", function (data) {
      let keywords = data.keywords;
      keywords.splice(keywords.indexOf(keyword), 1);
      chrome.storage.local.set({ keywords: keywords }, function () {
        console.log("keyword removed successfully");
      });
    });
    // Remove the list item from the DOM
    e.target.closest(".block-keyword-item").remove();
    updateColours();
  }
});

function updateColours() {
  const list = keywordsList.getElementsByClassName("block-keyword-item");
  let colSwitch = true;
  for (let i = 0; i < list.length; i++) {
    const col = colSwitch ? "#f4f3ef" : "white";
    list[i].style.backgroundColor = col;
    colSwitch = !colSwitch;
  }
}
