console.log("injected");

// Check if the current page is a Google Search page
if (
  window.location.hostname !== "www.google.com" &&
  window.location.pathname !== "/search"
) {
  (async () => {
    // List of keywords to filter out.
    // Create a Promise to wrap the chrome.storage.sync.get operation.
    const keywordsToFilter = await new Promise((resolve, reject) => {
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

    if (isPageSensitive(keywordsToFilter)) {
      chrome.runtime.sendMessage({ type: "insertCSS" });
    }
  })();
}

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

/* function filterPages(keywordsToFilter) {
  Select and remove search results with unwanted keywords
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
  checkScroll();
} */
