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
    const keyword = keywordInput.value
      .trim()
      .toLowerCase()
      .replace(/[.,:;()"*?!/]/g, "");
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

// Search button is pressed (enter key)
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && document.activeElement === searchKeywordInput) {
    chrome.storage.local.get("keywords", function (data) {
      const keywords = data.keywords;
      let value = searchKeywordInput.value.toLowerCase().trim();
      if (!value) {
        keywordsList.innerHTML = "";
        return;
      }

      // Sort by similarity to the target string
      keywords.sort((s, t) => {
        return levenshteinDistance(value, s) - levenshteinDistance(value, t);
      });

      const results = keywords.splice(0, 100);
      if (results.length === 0) {
        keywordsList.innerHTML = `<p class="no-results-msg">No results</p>`;
      } else {
        loadResults(results);
      }
    });
  }
});

function loadResults(keywords, length) {
  keywordsList.innerHTML = "";
  const index = length ? length : 0;
  const resultsLength = Math.min(20 + index, keywords.length);
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

// Calculates the number of modifications required to transform one string into another
function levenshteinDistance(s, t) {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
    }
  }
  return arr[t.length][s.length];
}
