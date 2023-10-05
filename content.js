console.log("injected");

// Check if the current page is a Google Search page
if (
  window.location.hostname === "www.google.com" &&
  window.location.pathname === "/search"
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

    // Select and remove search results with unwanted keywords
    const searchResults = document.querySelectorAll('[class^="g"]');
    //console.log(searchResults);
    searchResults.forEach((result) => {
      const titleElement = result.querySelector("h3");
      if (titleElement) {
        const title = titleElement.textContent.toLowerCase();
        if (keywordsToFilter.some((keyword) => title.includes(keyword))) {
          result.remove();
        }
      }
    });
  })();
}
