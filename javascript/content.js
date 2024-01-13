let blockedKeywords;
console.log("injected");

// Retrieves the blocked keywords from chrome.storage.sync.
function getBlockedKeywords() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { data: "fetchBlockedKeywords" },
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
} else if (isPageSensitive() === true) {
  // Check if current webpage has triggering content
  chrome.runtime.sendMessage({ type: "insertCSS" });
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
    const titleText = title.textContent.toLowerCase();
    if (blockedKeywords.some((keyword) => titleText.includes(keyword))) {
      console.log("title has blocked keyword");
      return true;
    }
  }

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const descriptionContent = metaDescription
      .getAttribute("content")
      .toLowerCase();
    if (
      blockedKeywords.some((keyword) => descriptionContent.includes(keyword))
    ) {
      console.log("meta description has blocked keyword");
      return true;
    }
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywordsContent = metaKeywords
      .getAttribute("content")
      .toLowerCase()
      .split(",");
    if (blockedKeywords.some((keyword) => keywordsContent.includes(keyword))) {
      console.log("meta keywords has blocked keyword");
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
  const searchResults = document.querySelectorAll('[class^="g"]');
  searchResults.forEach((result) => {
    // Check whehter the object is a safe site
    if (result.classList.contains("safe-site")) {
      return;
    }

    // Bool which checks whether an object selected is a search result leading to a site.
    let isSearchResult = false;

    const titleEl = result.querySelector("h3");
    // Check if unwanted keywords are in the title
    if (titleEl) {
      isSearchResult = true;
      const title = titleEl.textContent.toLowerCase().split(" ");
      if (title.some((word) => blockedKeywords.includes(word))) {
        console.log("search result title has blocked keyword");
        result.remove();
        return;
      }
    }

    // !!!DESCRIPTION.INCLUDES COULD LEAD TO SOME FALSE POSITIVES (a bigger word could have a substring which is in the list of triggering diseases)
    // Check if unwanted keywords are in the description
    const descriptionDiv = result.querySelector('[class^="VwiC3b"]');
    if (descriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = descriptionDiv.textContent.toLowerCase();
      // Check if unwanted keywords are in the description
      if (blockedKeywords.some((keyword) => description.includes(keyword))) {
        console.log("search result description has blocked keyword");
        result.remove();
        return;
      }
    }

    // !!!DESCRIPTION.INCLUDES COULD LEAD TO SOME FALSE POSITIVES (a bigger word could have a substring which is in the list of triggering diseases)
    // Check if unwanted keywords are in the description of the main result
    const mainResultDescriptionDiv = result.querySelector('[class^="hgKElc"]');
    if (mainResultDescriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = mainResultDescriptionDiv.textContent.toLowerCase();
      // Check if unwanted keywords are in the description
      if (blockedKeywords.some((keyword) => description.includes(keyword))) {
        console.log("main search result description has blocked keyword");
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
