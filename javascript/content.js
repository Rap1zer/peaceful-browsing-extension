let blockedKeywords;
let isBlocked = false; // So that the main page knows when a webpage is blocked or not (so the pause once button can appear or hide accordingly)

console.log("injected");
// Retrieves the blocked keywords from chrome.storage.local
function getBlockedKeywords() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("keywords", function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.keywords);
      }
    });
  });
}

// Check if the current page is a Google Search page
// Wrap in an async function to first check if the chrome extension / blocker is paused
(async () => {
  const data = await new Promise((resolve) => {
    chrome.storage.sync.get("isBlockerPaused", function (data) {
      resolve(data);
    });
  });
  if (data.isBlockerPaused) return;

  if (
    window.location.hostname == "www.google.com" &&
    window.location.pathname == "/search"
  ) {
    // Create first link element
    const link1 = document.createElement("link");
    link1.href =
      "https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,400;0,700;1,400&display=swap";
    link1.rel = "stylesheet";

    // Create second link element
    const link2 = document.createElement("link");
    link2.href =
      "https://fonts.googleapis.com/css2?family=Inria+Sans:ital,wght@0,400;0,700;1,400&display=swap";
    link2.rel = "stylesheet";

    // Append both link elements to the document's head
    document.head.appendChild(link1);
    document.head.appendChild(link2);

    // Filter the search results for triggering content
    filterPages(blockedKeywords);

    // Create a new MutationObserver with a callback function
    // The observer will watch for changes being made to the Search Results DOM and filter any new search results that get loaded
    const observer = new MutationObserver(function () {
      filterPages(blockedKeywords);
    });

    const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
    const config = { childList: true, subtree: true };

    if (targetNode) observer.observe(targetNode, config);
  } else {
    (async () => {
      // Check if current webpage contains triggering keywords
      const pageSensitivity = await isPageSensitive();
      if (pageSensitivity.sensitive) {
        // Blur the page and add a pop up
        appendDOMElements(pageSensitivity.word);
        chrome.runtime.sendMessage({ type: "insertCSS" });
        isBlocked = true;
      }
    })();
  }
})();

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
    const keyword = hasBlockedKeyword(titleText, blockedKeywords);
    if (keyword) {
      return {
        sensitive: true,
        word: keyword,
      };
    }
  }

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywordsContent = metaKeywords
      .getAttribute("content")
      .toLowerCase()
      .split(","); // Split text content into an array of keywords
    if (
      keywordsContent.some((word) => binarySearch(blockedKeywords, word) > -1)
    ) {
      return {
        sensitive: true,
        word: keywordsContent.find(
          (word) => binarySearch(blockedKeywords, word) > -1
        ),
      };
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
    const keyword = hasBlockedKeyword(descriptionContent, blockedKeywords);
    if (keyword) {
      return {
        sensitive: true,
        word: keyword,
      };
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

  //Select and remove search results with unwanted keywords [class^="g Ww4FFb"]
  const searchResults = document.querySelectorAll('[class^="g"]');
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
      const keyword = hasBlockedKeyword(title, blockedKeywords);
      if (keyword) {
        filterResult(result, keyword);
        return;
      }
    }

    // Check if unwanted keywords are in the description
    const descriptionDiv = result.querySelector('[class^="VwiC3b"]');
    if (descriptionDiv) {
      isSearchResult = true;
      // Get the description from the descriptionDiv
      const description = processText(descriptionDiv);
      const keyword = hasBlockedKeyword(description, blockedKeywords);
      // Check if unwanted keywords are in the description
      if (keyword) {
        filterResult(result, keyword);
        return;
      }
    }

    // Check if unwanted keywords are in the description of the main result L3Ezfd
    // const mainResultDescriptionDiv = result.querySelector('[class^="hgKElc"]');
    // if (mainResultDescriptionDiv) {
    //   isSearchResult = true;
    //   // Get the description from the descriptionDiv
    //   const description = processText(mainResultDescriptionDiv);
    //   console.log(description);
    //   // Check if unwanted keywords are in the description
    //   if (hasBlockedKeyword(description, blockedKeywords)) {
    //     filterResult(
    //       result,
    //       blockedKeywords.find((word) => description.includes(" " + word + " "))
    //     );
    //     return;
    //   }
    // }

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
  return array.find((word) => str.includes(" " + word + " "));
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
  // The view keywords button comes from the google search results page
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
  } else if (e.target.id.includes("view-keywords-btn")) {
    // The view keywords button comes from a blocked webpage
    const pEl = document.getElementById("keywords-p");
    if (pEl.style.display === "none" || pEl.style.display === "") {
      pEl.style.display = "block";
      e.target.textContent = "Hide triggering word";
    } else {
      pEl.style.display = "none";
      e.target.textContent = "View triggering word";
    }
  }
});

function appendDOMElements(word) {
  // Create the first link element for preconnecting to fonts.googleapis.com
  const link1 = document.createElement("link");
  link1.rel = "preconnect";
  link1.href = "https://fonts.googleapis.com";

  // Create the second link element for preconnecting to fonts.gstatic.com with crossorigin attribute
  const link2 = document.createElement("link");
  link2.rel = "preconnect";
  link2.href = "https://fonts.gstatic.com";
  link2.setAttribute("crossorigin", "");

  // Create the third link element for importing the font stylesheet
  const link3 = document.createElement("link");
  link3.rel = "stylesheet";
  link3.href =
    "https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,400;0,700;1,400&display=swap";

  // Append all link elements to the <head> of the document
  document.head.appendChild(link1);
  document.head.appendChild(link2);
  document.head.appendChild(link3);

  // Create a div element for the container
  const msgContainer = document.createElement("div");
  msgContainer.className = "msg";

  // Create an h1 element for the message
  const heading = document.createElement("h1");
  heading.textContent = "This webpage may contain triggering content";

  // Create a button element
  const button = document.createElement("button");
  button.id = "view-keywords-btn";
  button.textContent = "View triggering word";

  // Create a paragraph element
  const paragraph = document.createElement("p");
  paragraph.id = "keywords-p";
  paragraph.textContent = word;

  // Append the elements to the container
  msgContainer.appendChild(heading);
  msgContainer.appendChild(button);
  msgContainer.appendChild(paragraph);

  // Append the container to the document body, or any other desired location
  document.body.appendChild(msgContainer);
}

// Tell pause.js whether the currently active tab has triggering keywords (if so, pause.js will display the pause once button)
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("received message: " + message.type);
  if (message.type === "isBlocked") {
    // Respond to the message
    sendResponse({ isBlocked: isBlocked });
  }
  return true;
});
