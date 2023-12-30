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

    // Create a new MutationObserver with a callback function
    // The observer will watch for changes being made to the Search Results DOM and filter any new search results that get loaded
    const observer = new MutationObserver(function () {
      console.log("mutated");
      filterPages(keywordsToFilter);
    });

    const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
    const config = { childList: true, subtree: true };

    observer.observe(targetNode, config);
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
    if (
      keywordsContent &&
      keywordsContent.some((keyword) => keywordsContent.includes(keyword))
    ) {
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
    // Check whehter the object is a safe site
    if (result.classList.contains("safe-site")) {
      console.log(result);
      console.log("a safe site");
      return;
    }

    // Bool which checks whether an object selected is a search result leading to a site.
    let isSearchResult = false;

    const titleEl = result.querySelector("h3");
    // Check if unwanted keywords are in the title
    if (titleEl) {
      isSearchResult = true;
      const title = titleEl.textContent.toLowerCase();
      if (keywordsToFilter.some((keyword) => title.includes(keyword))) {
        result.remove();
        return;
      }
    }

    // Check if unwanted keywords are in the description
    const descriptionDiv = result.querySelector('[class^="VwiC3b"]');
    if (descriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = descriptionDiv.textContent.toLowerCase();
      // Check if unwanted keywords are in the description
      if (keywordsToFilter.some((keyword) => description.includes(keyword))) {
        result.remove();
        return;
      }
    }

    // If it is a search result and it does not have any unwanted keywords, add a class marking it as a "safe-site"
    if (isSearchResult) {
      result.classList.add("safe-site");
    }
  });
}
