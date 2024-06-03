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
    const links = [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,400;0,700;1,400&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inria+Sans:ital,wght@0,400;0,700;1,400&display=swap",
      },
    ];
    appendGoogleLinks(links);
    filterPages();

    // The observer will watch for changes being made to the Search Results DOM and filter any new search results that get loaded
    const observer = new MutationObserver(filterPages);
    const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
    if (targetNode)
      observer.observe(targetNode, { childList: true, subtree: true });
  } else {
    // Check if current webpage contains triggering keywords
    const pageSensitivity = await isPageSensitive();
    if (pageSensitivity.sensitive) {
      // Blur the page and add a pop up
      appendDOMElements(pageSensitivity.words);
      chrome.runtime.sendMessage({ type: "insertCSS" });
      isBlocked = true;
    }
  }
})();

// Append Google links
function appendGoogleLinks(links) {
  links.forEach(({ rel, href, crossorigin }) => {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (crossorigin) link.setAttribute("crossorigin", crossorigin);
    document.head.appendChild(link);
  });
}

// Return if page's title, meta description or meta keywords contains a filtered keyword
async function isPageSensitive() {
  try {
    blockedKeywords = await getBlockedKeywords();
  } catch (error) {
    console.error(error);
  }

  let keywordsFound = [];

  const elementsToCheck = [
    document.querySelector("title"),
    document.querySelector('meta[name="keywords"]'),
    document.querySelector('meta[name="description"]'),
  ];

  // Retrieve all the triggering keywords in each element.
  elementsToCheck.forEach((el) => {
    if (!el) return; // If no element is found in the page, skip forEach iteration
    let text = el.getAttribute("content") || el.textContent;
    if (!text) return; // If element has no content attribute, skip forEach iteration
    text = processText(text);
    const keywords = hasBlockedKeyword(text);
    if (keywords) keywordsFound.push(...keywords);
  });

  if (keywordsFound.length > 0) {
    return { sensitive: true, words: removeDuplicates(keywordsFound) };
  }

  return { sensitive: false };
}

// Filter search results with unwanted keywords.
async function filterPages() {
  try {
    blockedKeywords = await getBlockedKeywords();
  } catch (error) {
    console.error(error);
  }

  // Select and remove search results with unwanted keywords
  const searchResults = document.querySelectorAll('[class^="g"]');

  searchResults.forEach((result) => {
    // No need to analyse the result if it has the "safe-el" class
    if (result.classList.contains("safe-el")) return;

    let keywordsFound = [];
    const elementsToCheck = [
      result.querySelector("h3"),
      result.querySelector('[class^="VwiC3b"]'),
      result.querySelector('[class^="hgKElc"]'),
    ];

    elementsToCheck.forEach((el) => {
      if (!el) return; // If no element is found in the result, skip forEach iteration
      if (!el.textContent) return; // If element has no text content, skip forEach iteration
      const text = processText(el.textContent);
      const keywords = hasBlockedKeyword(text);
      if (keywords) keywordsFound.push(...keywords);
    });

    if (keywordsFound.length > 0) {
      keywordsFound = removeDuplicates(keywordsFound);
      filterResult(result, keywordsFound);
      return;
    }

    result.classList.add("safe-el");
  });
}

function processText(el) {
  return " " + el.toLowerCase().replace(/[.,:;()"*?!/]/g, "") + " ";
}

function hasBlockedKeyword(str) {
  const filteredArr = blockedKeywords.filter((word) =>
    str.includes(" " + word + " ")
  );
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
  const isHidden = pEl.style.display === "none" || pEl.style.display === "";
  pEl.style.display = isHidden ? "block" : "none";
  btn.textContent = isHidden
    ? "Hide triggering word(s)"
    : "View triggering word(s)";
}

// Append a pop-up to a wepbage containing triggering keyword(s)
function appendDOMElements(words) {
  const links = [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Inria+Serif:ital,wght@0,400;0,700;1,400&display=swap",
    },
  ];

  appendGoogleLinks(links);

  const msgContainer = document.createElement("div");
  msgContainer.className = "msg";
  msgContainer.innerHTML = `
    <h1>This webpage may contain triggering content</h1>
    <button id="view-keywords-btn">View triggering word(s)</button>
    <p id="keywords-p">${words.join(", ")}</p>`;

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
