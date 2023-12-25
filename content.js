let keywordsToFilter;
console.log("injected");

(async () => {
  // List of keywords to filter out.
  // Create a Promise to wrap the chrome.storage.sync.get operation.
  keywordsToFilter = await new Promise((resolve, reject) => {
    // Use chrome.storage.sync.get to retrieve the filtered keywords.
    chrome.storage.sync.get("filteredKeywords", async function (data) {
      if (chrome.runtime.lastError) {
        // If there is an error, reject the Promise with the error.
        reject(chrome.runtime.lastError);
      } else {
        // If the filtered keywords is successfully retrieved, resolve the Promise with the data.
        resolve(data.filteredKeywords);
      }
    });
  });

  // Check if the current page is a Google Search page
  if (
    window.location.hostname == "www.google.com" &&
    window.location.pathname == "/search"
  ) {
    // Filter the search results for triggering content
    filterPages(keywordsToFilter);
  } else {
    // Check if current webpage has triggering content
    if (isPageSensitive(keywordsToFilter)) {
      chrome.runtime.sendMessage({ type: "insertCSS" });
    }
  }
})();

// Return if page's title, meta description or meta keywords contains a filtered keyword
function isPageSensitive(keywordsToFilter) {
  const title = document.querySelector("title");
  if (title) {
    const titleText = title.textContent.toLowerCase();
    if (keywordsToFilter.some((keyword) => titleText.includes(keyword))) {
      return true;
    }
  }

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const descriptionContent = metaDescription
      .getAttribute("content")
      .toLowerCase();
    if (
      keywordsToFilter.some((keyword) => descriptionContent.includes(keyword))
    ) {
      return true;
    }
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywordsContent = metaKeywords.getAttribute("content").toLowerCase();
    if (keywordsContent.some((keyword) => keywordsContent.includes(keyword))) {
      return true;
    }
  }

  return false;
}

// Filter search results with unwanted keywords.
function filterPages(keywordsToFilter) {
  //Select and remove search results with unwanted keywords
  const searchResults = document.querySelectorAll('[class^="g"]');
  searchResults.forEach((result) => {
    const titleElement = result.querySelector("h3");
    if (titleElement) {
      const title = titleElement.textContent.toLowerCase();
      if (keywordsToFilter.some((keyword) => title.includes(keyword))) {
        result.remove();
      }
    }
  });
}

// Create a new MutationObserver with a callback function
// The observer will watch for changes being made to the Search Results DOM and filter any new search results that get loaded
const observer = new MutationObserver(function (mutationList) {
  console.log("mutated");
  filterPages(keywordsToFilter);
});

const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
const config = { childList: true, subtree: true };

observer.observe(targetNode, config);
