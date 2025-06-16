const keywordInput = document.getElementById("new-keyword-input");
const searchKeywordInput = document.getElementById("keyword-search-input");
const blockKeywordMsg = document.getElementById("block-new-keyword-msg");
const blockKeywordBtn = document.getElementById("block-new-keyword-btn");
const keywordsList = document.getElementById("blocked-keywords-list");

blockKeywordBtn.addEventListener("click", blockKeyword);

function blockKeyword() {
  const keyword = keywordInput.value
    .trim()
    .toLowerCase()
    .replace(/[.,:;()"*?!/]/g, "");

  // Do not block keyword if the keyword input field is empty (there is no keyword)
  if (!keywordInput.value.trim()) {
    return;
  }
  // Fetch blocked keywords from background.js and add the keyword to the array
  chrome.storage.local.get("keywords", function (data) {
    keywords = data.keywords || [];

    //Do not add keyword to list if keyword is already in list.
    if (keywords.includes(keyword)) {
      blockKeywordMsg.textContent =
        keyword + " is already in the list of keywords";
      return;
    }

    if (keyword.length >= 50) {
      blockKeywordMsg.textContent = "Input is too long";
      return;
    }
    // Push the new keyword into the list of blocked keywords.
    chrome.runtime.sendMessage({ type: "blockKeyword", keyword: keyword });
    blockKeywordMsg.textContent = `"${keyword}" is now blocked`;
  });
}

// Enter key is pressed while input field is active
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (document.activeElement === searchKeywordInput) {
      search();
    } else if (document.activeElement === keywordInput) {
      blockKeyword();
    }
  }
});

document.getElementById("magnifying-glass").addEventListener("click", search);

function search() {
  const value = searchKeywordInput.value.toLowerCase().trim();
  if (!value) {
    keywordsList.innerHTML = "";
    return;
  }

  chrome.storage.local.get("keywords", function (data) {
    const keywords = data.keywords;
    const maxDist = Math.ceil(value.length * (1 / 3));
    const results = [];

    // get all keywords within 'maxDist' levenshtein distance
    for (let keyword of keywords) {
      const dist = levenshteinDistance(value, keyword);
      if (dist <= maxDist) {
        results.push({ keyword, dist });
      }
    }

    // Sort the results so the most similar keywords appear at the top
    results.sort((a, b) => a.dist - b.dist);

    if (results.length === 0) {
      keywordsList.innerHTML = `<p class="no-results-msg">No results</p>`;
    } else {
      loadResults(results.map((item) => item.keyword));
    }
  });
}

function loadResults(keywords, length = 0) {
  keywordsList.innerHTML = "";
  const resultsLength = Math.min(20 + length, keywords.length);
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

  const dp = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[s.length][t.length];
}
