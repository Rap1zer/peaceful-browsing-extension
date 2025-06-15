console.log("Extension script loaded.");

let blockedKeywords = [];
let isBlocked = false;

// Retrieves the blocked keywords from chrome.storage.local
async function fetchBlockedKeywords() {
  try {
    console.log("Fetching blocked keywords from storage...");
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get("keywords", function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.keywords);
        }
      });
    });
    blockedKeywords = result || [];
    console.log("Blocked keywords fetched:", blockedKeywords);
  } catch (error) {
    console.error("Error fetching blocked keywords:", error);
  }
}

// Initialize the extension
(async () => {
  console.log("Initializing extension...");
  const data = await new Promise((resolve) => {
    chrome.storage.sync.get("isBlockerPaused", resolve);
  });
  console.log("Blocker paused status:", data.isBlockerPaused);
  if (data.isBlockerPaused) {
    console.log("Blocker is paused. Exiting initialization.");
    return;
  }

  await fetchBlockedKeywords();

  if (
    window.location.hostname == "www.google.com" &&
    window.location.pathname == "/search"
  ) {
    console.log("On Google Search results page.");
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

    const observer = new MutationObserver(filterPages);
    const targetNode = document.body.getElementsByClassName("GyAeWb")[0];
    if (targetNode) {
      console.log("Setting up MutationObserver on search results container.");
      observer.observe(targetNode, { childList: true, subtree: true });
    } else {
      console.warn("Search results container not found.");
    }
  } else {
    console.log("Checking if current page is sensitive.");
    const pageSensitivity = await isPageSensitive();
    console.log("Page sensitivity check result:", pageSensitivity);
    if (pageSensitivity.sensitive) {
      console.log("Page is sensitive. Applying blur and popup.");
      console.log(pageSensitivity.words);
      appendDOMElements(pageSensitivity.words);
      chrome.runtime.sendMessage({ type: "insertCSS" });
      isBlocked = true;
    } else {
      console.log("Page is not sensitive.");
    }
  }
})();

// Append Google links
function appendGoogleLinks(links) {
  console.log("Appending Google font links...");
  links.forEach(({ rel, href, crossorigin }) => {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (crossorigin) link.setAttribute("crossorigin", crossorigin);
    document.head.appendChild(link);
  });
  console.log("Google font links appended.");
}

// Return if page's title, meta description or meta keywords contains a filtered keyword
async function isPageSensitive() {
  console.log("Running page sensitivity check...");
  let keywordsFound = new Set();

  const elementsToCheck = [
    document.querySelector("title"),
    document.querySelector('meta[name="keywords"]'),
    document.querySelector('meta[name="description"]'),
  ];

  elementsToCheck.forEach((el) => {
    if (!el) {
      console.log("Element to check not found:", el);
      return; // skip if not found
    }
    let text = el.getAttribute("content") || el.textContent;
    if (!text) {
      console.log("No text content found in element:", el);
      return;
    }
    text = processText(text);
    const keywords = hasBlockedKeyword(text);
    if (keywords) {
      keywordsFound.add(keywords);
    }
  });

  if (keywordsFound.size > 0) {
    console.log("Page contains sensitive keywords:", keywordsFound);
    return { sensitive: true, words: Array.from(keywordsFound) };
  }

  console.log("No sensitive keywords found on page.");
  return { sensitive: false };
}

function getSearchResults() {
  const h3Elements = document.querySelectorAll('#rso a > h3:not([data-processed])');
  const resultElements = new Set();

  h3Elements.forEach((h3) => {
    let container = h3.closest('div');
    const anchorEl = container.querySelector('a');
    while (container && container !== document.body) {
      if (container.classList.contains("safe-el") || container.classList.contains("blocked-result")) break;
      const containerChildren = container.querySelectorAll('div, span');

      // Loop through each element in container and check if it contains text
      const hasTextOutsideH3 = Array.from(containerChildren).some((el) => {
        const text = el.textContent?.trim();
        return (
          text &&
          text.length > 30 && // Heuristics: is snippet text, not noise
          !anchorEl.textContent.includes(text) && // Heuristics: does not contain anchor text
          !el.contains(h3) &&
          el !== h3);
      });

      if (hasTextOutsideH3) {
        //console.log("Found result element:", container, " with text:", container.textContent);
        resultElements.add(container);
        break;
      }

      container = container.parentElement;
    }

    h3.setAttribute("data-processed", true);
  });
  
  return Array.from(resultElements);
}

function extractTextNodes(result) {
  const texts = [];

  // Get all elements with visible text (skip script, style, etc.)
  result.querySelectorAll("h3, span, div").forEach((el) => {
    if (!el.closest("script, style, head") && el.textContent.trim().length > 0) {
      texts.push(el.textContent.trim());
    }
  });

  return texts;
}

// Filter search results with unwanted keywords.
async function filterPages() {
  const results = getSearchResults();
  console.log(`Found ${results.length} new results.`);

  results.forEach((result) => {
    const textBlocks = extractTextNodes(result);
    const keywordsFound = new Set();

    textBlocks.forEach((text) => {
      const processed = processText(text);
      const found = hasBlockedKeyword(processed);
      if (found) keywordsFound.add(found);
    });

    if (keywordsFound.size > 0) {
      filterResult(result, Array.from(keywordsFound));
    } else {
      result.classList.add("safe-el");
    }
  });
}


function processText(el) {
  return el.toLowerCase().replace(/[.,:;()"*?!/]/g, "");
}

function hasBlockedKeyword(str) {
  for (const word of blockedKeywords) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i'); // 'i' for case-insensitive
    if (regex.test(str)) return word; // early return for first match
  }
  return undefined;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape special regex characters
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
  console.log(`Blocking a search result for keywords: ${keywordsFound.join(", ")}`);
  result.textContent = '';

  // Create h1
  const heading = document.createElement('h1');
  heading.textContent = 'This result may be triggering';
  result.appendChild(heading);

  // Create button
  const button = document.createElement('button');
  button.id = `view-keywords-btn-${resultNum}`;
  button.textContent = 'View triggering word(s)';
  result.appendChild(button);

  // Create paragraph
  const paragraph = document.createElement('p');
  paragraph.id = `${resultNum}-result`;
  paragraph.textContent = keywordsFound.join(", ");
  result.appendChild(paragraph);

  result.classList.add("blocked-result");
  resultNum++;
}

document.addEventListener("click", (e) => {
  // View / hide the triggering keywords of a triggering result or webpage
  if (e.target.id.includes("view-keywords-btn")) {
    console.log("View keywords button clicked:", e.target.id);
    const pEl = e.target.nextElementSibling;
    toggleKeywordVisibility(pEl, e.target);
  }
});

function toggleKeywordVisibility(pEl, btn) {
  const isHidden = pEl.style.display === "none" || pEl.style.display === "";
  pEl.style.setProperty("display", isHidden ? "block" : "none", "important");
  btn.textContent = isHidden
    ? "Hide triggering word(s)"
    : "View triggering word(s)";
}

// Append a pop-up to a webpage containing triggering keyword(s)
function appendDOMElements(words) {
  // Append the Google font links
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
  msgContainer.className = "health_anxiety_msg";

  // Create h1
  const heading = document.createElement("h1");
  heading.textContent = "This webpage may contain triggering content";
  msgContainer.appendChild(heading);

  // Create button
  const button = document.createElement("button");
  button.id = "view-keywords-btn";
  button.textContent = "View triggering word(s)";
  msgContainer.appendChild(button);

  // Create paragraph
  const paragraph = document.createElement("p");
  paragraph.id = "keywords-p";
  paragraph.textContent = words.join(", ");
  msgContainer.appendChild(paragraph);

  document.body.appendChild(msgContainer);
  console.log("Popup appended to the DOM.");
}
