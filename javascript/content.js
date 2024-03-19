let blockedKeywords;
let isBlocked = false;

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
        appendDOMElements(pageSensitivity.words);
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

  let keywordsFound = [];

  // Check if unwanted keywords are in the title of the webpage
  const title = document.querySelector("title");
  if (title) {
    const titleText = processText(title);
    const keywords = hasBlockedKeyword(titleText, blockedKeywords);
    if (keywords) {
      console.log("has blocked keywords in the title");
      keywordsFound = keywordsFound.concat(keywords);
    }
  }

  // Check if unwanted keywords are in the meta keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    const keywordsContent =
      " " +
      metaKeywords.getAttribute("content").toLowerCase().replace(/,/g, " ") +
      " ";
    const keywords = hasBlockedKeyword(keywordsContent, blockedKeywords);
    console.log(keywordsContent);
    if (keywords) {
      console.log("has blocked keywords in meta keywords");
      keywordsFound = keywordsFound.concat(keywords);
    }
  }

  // Check if unwanted keywords are in the meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const descriptionContent =
      " " +
      metaDescription
        .getAttribute("content")
        .toLowerCase()
        .replace(/[.,:;()"*?!/]/g, "") + // replaces special characters with ""
      " ";
    console.log(descriptionContent);
    const keywords = hasBlockedKeyword(descriptionContent, blockedKeywords);
    if (keywords) {
      keywordsFound = keywordsFound.concat(keywords);
    }
  }

  if (keywordsFound.length > 0) {
    keywordsFound = removeDuplicates(keywordsFound);
    return { sensitive: true, words: keywordsFound };
  }

  return false;
}

// Filter search results with unwanted keywords.
async function filterPages() {
  try {
    blockedKeywords = await getBlockedKeywords();
  } catch (error) {
    console.log(error);
  }

  // Select and remove search results with unwanted keywords
  const searchResults = document.querySelectorAll('[class^="g"]');

  searchResults.forEach((result) => {
    // No need to analyse the result if it has the "safe-el" class
    if (result.classList.contains("safe-el")) return;

    let keywordsFound = [];

    const titleEl = result.querySelector("h3");
    //Check if unwanted keywords are in the title
    if (titleEl) {
      const title = processText(titleEl);
      const keywords = hasBlockedKeyword(title, blockedKeywords);
      if (keywords) keywordsFound = keywordsFound.concat(keywords);
    }

    // Check if unwanted keywords are in the description
    const descriptionDiv = result.querySelector('[class^="VwiC3b"]');
    if (descriptionDiv) {
      const description = processText(descriptionDiv);
      console.log(description);
      const keywords = hasBlockedKeyword(description, blockedKeywords);
      if (keywords) keywordsFound = keywordsFound.concat(keywords);
    }

    // Check if unwanted keywords are in the description of the main result
    const mainResultDescriptionDiv = result.querySelector('[class^="hgKElc"]');
    if (mainResultDescriptionDiv) {
      const description = processText(mainResultDescriptionDiv);
      const keywords = hasBlockedKeyword(description, blockedKeywords);
      if (keywords) {
        keywordsFound = keywordsFound.concat(keywords);
        mainResultDescriptionDiv.textContent = "";
      }
    }

    if (keywordsFound.length > 0) {
      keywordsFound = removeDuplicates(keywordsFound);
      filterResult(result, keywordsFound);
      return;
    }

    // If it does not have any unwanted keywords, add a class marking it as a "safe-site"
    result.classList.add("safe-el");
  });
}

function processText(el) {
  return " " + el.textContent.toLowerCase().replace(/[.,:;()"*?!/]/g, "") + " ";
}

function hasBlockedKeyword(str, array) {
  const filteredArr = array.filter((word) => str.includes(" " + word + " "));
  if (filteredArr.length > 0) return filteredArr;
  return undefined;
}

// Remove duplicates from an array
function removeDuplicates(arr) {
  let unique = arr.reduce(function (acc, curr) {
    if (!acc.includes(curr)) acc.push(curr);
    return acc;
  }, []);
  return unique;
}

// Block the search result
let resultNum = 0;
function filterResult(result, keywordsFound) {
  result.innerHTML = `
  <h1>This result may potentially be triggering</h1>
  <button id="view-keywords-btn-${resultNum}">View triggering word(s)</button>
  <p id="${resultNum}-result">${keywordsFound.join(", ")}</p>`;
  result.classList.add("blocked-result");
  resultNum++;
}

document.addEventListener("click", (e) => {
  // View / hide the triggering keywords of a triggering result or webpage
  // The view keywords button comes from the google search results page
  if (e.target.id.includes("view-keywords-btn-")) {
    let num = e.target.id.match(/(\d+)$/)[0]; // match consecutive digits at the end of the id
    const pEl = document.getElementById(`${num}-result`);
    toggleKeywordVisibility(pEl, e.target);
  } else if (e.target.id.includes("view-keywords-btn")) {
    // The view keywords button comes from a blocked webpage
    const pEl = document.getElementById("keywords-p");
    toggleKeywordVisibility(pEl, e.target);
  }
});

function toggleKeywordVisibility(pEl, btn) {
  if (pEl.style.display === "none" || pEl.style.display === "") {
    pEl.style.display = "block";
    btn.textContent = "Hide triggering word(s)";
  } else {
    pEl.style.display = "none";
    btn.textContent = "View triggering word(s)";
  }
}

// Append a pop-up to a wepbage containing triggering keyword(s)
function appendDOMElements(words) {
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
  button.textContent = "View triggering word(s)";

  // Create a paragraph element
  const paragraph = document.createElement("p");
  paragraph.id = "keywords-p";
  paragraph.textContent = words.join(", ");

  // Append the elements to the container and then to the document
  msgContainer.appendChild(heading);
  msgContainer.appendChild(button);
  msgContainer.appendChild(paragraph);
  document.body.appendChild(msgContainer);
}

// Removed to follow Google's program policy
// Tell pause.js whether the currently active tab has triggering keywords (if so, pause.js will display the pause once button)
// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//   if (message.type === "isBlocked") {
//     // Respond to the message
//     sendResponse({ isBlocked: isBlocked });
//   }
//   return true;
// });
