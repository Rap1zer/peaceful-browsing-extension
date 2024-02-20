let blockedKeywords;

document.head.innerHTML += `
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,400;0,700;1,400&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Inria+Sans:ital,wght@0,400;0,700;1,400&display=swap"
  rel="stylesheet"
/>`;

console.log("injected");
// Retrieves the blocked keywords from chrome.storage.sync.
function getBlockedKeywords() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "fetchBlockedKeywords" },
      function (blockedKeywords) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(blockedKeywords);
        }
      }
    );
  });
}

// Check if the current page is a Google Search page
if (
  window.location.hostname == "www.google.com" &&
  window.location.pathname == "/search"
) {
  // Filter the search results for triggering content
  filterPages(blockedKeywords);

  // Create a new MutationObserver with a callback function
  // The observer will watch for changes being made to the Search Results DOM and filter any new search results that get loaded
  const observer = new MutationObserver(function () {
    console.log("mutated");
    filterPages(blockedKeywords);
  });

  const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
  const config = { childList: true, subtree: true };

  observer.observe(targetNode, config);
} else {
  (async () => {
    //Check if the webpage is among the list of blocked URLs
    chrome.runtime.sendMessage({
      type: "checkIfHostnameIsBlocked",
      data: window.location.href,
    });

    // Check if current webpage contains triggering keywords
    if ((await isPageSensitive()) === true) {
      chrome.runtime.sendMessage({ type: "insertCSS" });
    }
  })();
}

// Return if page's title, meta description or meta keywords contains a filtered keyword
async function isPageSensitive() {
  try {
    blockedKeywords = await getBlockedKeywords();
  } catch (error) {
    console.log(error);
  }

  const title = document.querySelector("title");
  if (title) {
    const titleText = processText(title);
    if (hasBlockedKeyword(titleText, blockedKeywords)) {
      console.log(
        "title has blocked keyword: " +
          blockedKeywords.find((word) => titleText.includes(" " + word + " "))
      );
      return true;
    }
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywordsContent = metaKeywords
      .getAttribute("content")
      .toLowerCase()
      .split(","); // Split text content into an array of keywords
    console.log(keywordsContent);
    if (
      keywordsContent.some((word) => binarySearch(blockedKeywords, word) > -1)
    ) {
      console.log(
        "meta keywords has blocked keyword: " +
          keywordsContent.find(
            (word) => binarySearch(blockedKeywords, word) > -1
          )
      );
      console.log(metaKeywords);
      return true;
    }
  }

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const descriptionContent =
      " " +
      metaDescription
        .getAttribute("content")
        .toLowerCase()
        .replace(/[^\w\s]/g, "") +
      " ";
    if (hasBlockedKeyword(descriptionContent, blockedKeywords)) {
      console.log(
        "meta description has blocked keyword: " +
          blockedKeywords.find((word) =>
            descriptionContent.includes(" " + word + " ")
          )
      );
      return true;
    }
  }

  console.log("page is not sensitive");
  return false;
}

// Filter search results with unwanted keywords.
async function filterPages(blockedKeywords) {
  try {
    blockedKeywords = await getBlockedKeywords();
  } catch (error) {
    console.log(error);
  }

  //Select and remove search results with unwanted keywords
  const searchResults = document.querySelectorAll('[class^="g Ww4FFb"]');
  searchResults.forEach((result) => {
    // Check whether the object is a safe site
    if (result.classList.contains("safe-site")) {
      return;
    }

    // Bool which checks whether an object selected is a search result leading to a site.
    let isSearchResult = false;

    const titleEl = result.querySelector("h3");
    //Check if unwanted keywords are in the title
    if (titleEl) {
      isSearchResult = true;
      const title = processText(titleEl);
      if (hasBlockedKeyword(title, blockedKeywords)) {
        filterResult(
          result,
          blockedKeywords.find((word) => title.includes(" " + word + " "))
        );
        return;
      }
    }

    // Check if unwanted keywords are in the description
    const descriptionDiv = result.querySelector('[class^="VwiC3b"]');
    if (descriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = processText(descriptionDiv);
      // Check if unwanted keywords are in the description
      if (hasBlockedKeyword(description, blockedKeywords)) {
        filterResult(
          result,
          blockedKeywords.find((word) => description.includes(" " + word + " "))
        );
        return;
      }
    }

    // Check if unwanted keywords are in the description of the main result
    const mainResultDescriptionDiv = result.querySelector('[class^="hgKElc"]');
    if (mainResultDescriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = processText(mainResultDescriptionDiv);
      // Check if unwanted keywords are in the description
      if (hasBlockedKeyword(description, blockedKeywords)) {
        filterResult(
          result,
          blockedKeywords.find((word) => description.includes(" " + word + " "))
        );
        return;
      }
    }

    // If it is a search result and it does not have any unwanted keywords, add a class marking it as a "safe-site"
    if (isSearchResult) {
      result.classList.add("safe-site");
    }
  });
}

function processText(el) {
  return " " + el.textContent.toLowerCase().replace(/[^\w\s]/g, "") + " ";
}

function hasBlockedKeyword(str, array) {
  return array.some((word) => str.includes(" " + word + " "));
}

let resultNum = 0;
function filterResult(result, keywordFound) {
  result.innerHTML = `
  <h1>This result may potentially be triggering</h1>
  <button id="view-keywords-btn-${resultNum}">View triggering word</button>
  <p id="${resultNum}-result">${keywordFound}</p>`;
  result.classList.add("blocked-result");
  resultNum++;
}

document.addEventListener("click", (e) => {
  if (e.target.id.includes("view-keywords-btn-")) {
    let num = e.target.id.match(/(\d+)$/)[0];
    const pEl = document.getElementById(`${num}-result`);
    if (pEl.style.display === "none" || pEl.style.display === "") {
      pEl.style.display = "block";
      e.target.textContent = "Hide triggering word";
    } else {
      pEl.style.display = "none";
      e.target.textContent = "View triggering word";
    }
  }
});
