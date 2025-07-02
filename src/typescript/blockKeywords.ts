const keywordInput = document.getElementById("new-keyword-input") as HTMLInputElement;
const searchKeywordInput = document.getElementById("keyword-search-input") as HTMLInputElement;
const blockKeywordMsg = document.getElementById("block-new-keyword-msg") as HTMLElement;
const blockKeywordBtn = document.getElementById("block-new-keyword-btn") as HTMLButtonElement;
const keywordsList = document.getElementById("blocked-keywords-list") as HTMLElement;

blockKeywordBtn.addEventListener("click", blockKeyword);

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    if (document.activeElement === searchKeywordInput) {
      search();
    } else if (document.activeElement === keywordInput) {
      blockKeyword();
    }
  }
});

function blockKeyword(): void {
  const rawInput = keywordInput.value.trim();
  const keyword = rawInput.toLowerCase().replace(/[.,:;()"*?!/]/g, "");

  if (!rawInput) return;

  chrome.storage.local.get("keywords", (data: { keywords?: string[] }) => {
    const keywords: string[] = data.keywords || [];

    if (keywords.includes(keyword)) {
      blockKeywordMsg.textContent = `${keyword} is already in the list of keywords`;
      return;
    }

    if (keyword.length >= 50) {
      blockKeywordMsg.textContent = "Input is too long";
      return;
    }

    chrome.runtime.sendMessage({ type: "blockKeyword", keyword });
    blockKeywordMsg.textContent = `"${keyword}" is now blocked`;
  });
}

document.getElementById("magnifying-glass")?.addEventListener("click", search);

function search(): void {
  const value = searchKeywordInput.value.toLowerCase().trim();
  if (!value) {
    keywordsList.innerHTML = "";
    return;
  }

  chrome.storage.local.get("keywords", (data: { keywords: string[] }) => {
    const keywords = data.keywords || [];
    const maxDist = Math.ceil(value.length * (1 / 3));
    const results: { keyword: string; dist: number }[] = [];

    for (const keyword of keywords) {
      const dist = levenshteinDistance(value, keyword);
      if (dist <= maxDist) {
        results.push({ keyword, dist });
      }
    }

    results.sort((a, b) => a.dist - b.dist);

    if (results.length === 0) {
      keywordsList.innerHTML = `<p class="no-results-msg">No results</p>`;
    } else {
      loadResults(results.map((item) => item.keyword));
    }
  });
}

function loadResults(keywords: string[], length: number = 0): void {
  keywordsList.innerHTML = "";
  const resultsLength = Math.min(20 + length, keywords.length);
  let colSwitch = true;

  for (let i = 0; i < resultsLength; i++) {
    const col = colSwitch ? "#f4f3ef" : "white";
    const keyword = keywords[i];
    keywordsList.innerHTML += `
      <li class="block-keyword-item" style="background: ${col}">
        <p>${keyword}</p>
        <button id="${keyword}-keyword-item"><i class="fa-solid fa-lg fa-trash" id="${keyword}-keyword-item"></i></button>
      </li>`;
    colSwitch = !colSwitch;
  }

  if (resultsLength < keywords.length) {
    keywordsList.innerHTML += `
      <button class="load-more-btn" id="load-more-btn">Load more</button>`;

    document.getElementById("load-more-btn")?.addEventListener("click", () => {
      loadResults(keywords, resultsLength);
    });
  }
}

document.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.id.includes("-keyword-item")) {
    const keyword = target.id.split("-")[0];

    chrome.storage.local.get("keywords", (data: { keywords: string[] }) => {
      const keywords = data.keywords || [];
      const index = keywords.indexOf(keyword);
      if (index !== -1) {
        keywords.splice(index, 1);
        chrome.storage.local.set({ keywords });
      }
    });

    target.closest(".block-keyword-item")?.remove();
    updateColours();
  }
});

function updateColours(): void {
  const items = keywordsList.getElementsByClassName("block-keyword-item") as HTMLCollectionOf<HTMLElement>;
  let colSwitch = true;

  for (let i = 0; i < items.length; i++) {
    const col = colSwitch ? "#f4f3ef" : "white";
    items[i].style.backgroundColor = col;
    colSwitch = !colSwitch;
  }
}

function levenshteinDistance(s: string, t: string): number {
  if (!s.length) return t.length;
  if (!t.length) return s.length;

  const dp: number[][] = Array.from({ length: s.length + 1 }, () =>
    Array(t.length + 1).fill(0)
  );

  for (let i = 0; i <= s.length; i++) dp[i][0] = i;
  for (let j = 0; j <= t.length; j++) dp[0][j] = j;

  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= t.length; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // deletion
        dp[i][j - 1] + 1,     // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[s.length][t.length];
}
