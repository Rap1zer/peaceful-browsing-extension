let blockedKeywords: string[] = [];
let blockedRegexes: RegExp[] = [];

// Google Search results container
const resultsContainer = document.getElementById("main") as HTMLElement;

// Retrieves the blocked keywords from chrome.storage.local
async function fetchBlockedKeywords(): Promise<void> {
  try {
    const result = await new Promise<string[] | undefined>((resolve, reject) => {
      chrome.storage.local.get("keywords", function (result) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.keywords);
        }
      });
    });
    blockedKeywords = result || [];
    compileBlockedRegexes();
  } catch (error) {
    console.error("Error fetching blocked keywords:", error);
  }
}

/**
 * Main initialization function that checks blocker state,
 * detects page type, and either filters results or applies a warning overlay.
 */
(async () => {
  // Check if extension is currently paused
  const data = await new Promise<{ isBlockerPaused?: boolean }>((resolve) => {
    chrome.storage.sync.get(["isBlockerPaused"], (items) => {
      resolve(items);
    });
  });
  if (data.isBlockerPaused) {
    return;
  }

  await fetchBlockedKeywords();

  // Handle Google search results page
  if (
    window.location.hostname === "www.google.com" &&
    window.location.pathname === "/search"
  ) {
    const links: { rel: string; href: string; crossorigin?: string }[] = [
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
    filterSearchResults();

    // Observe for dynamic content (new search results)
    const observer = new MutationObserver(filterSearchResults);
    const targetNode =  resultsContainer;
    if (targetNode) {
      observer.observe(targetNode, { childList: true, subtree: true });
    } else {
      console.warn("Search results container not found.");
    }
  } else {
    // Not a Google search page: check for sensitive content in meta/title
    const pageSensitivity = await isPageSensitive();
    if (pageSensitivity.sensitive) {
      appendDOMElements(pageSensitivity.words);
      chrome.runtime.sendMessage({ type: "insertCSS" });
    } else {
    }
  }
})();

// Adds custom fonts to the page head
function appendGoogleLinks(links: { rel: string; href: string; crossorigin?: string }[]): void {
  links.forEach(({ rel, href, crossorigin }) => {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (crossorigin) link.setAttribute("crossorigin", crossorigin);
    document.head.appendChild(link);
  });
}

// Checks page title and meta tags for blocked keywords.
async function isPageSensitive(): Promise<{ sensitive: boolean; words: string[] }> {
  const keywordsFound = new Set<string>();

  const elementsToCheck = [
    document.querySelector("title"),
    document.querySelector('meta[name="keywords"]'),
    document.querySelector('meta[name="description"]'),
  ];

  elementsToCheck.forEach((el) => {
    if (!el) return;

    const text = (el.getAttribute("content") || el.textContent || "").trim();
    if (!text) return;

    const processed = processText(text);
    const newKeywordsFound = getBlockedKeywords(processed);
    newKeywordsFound.forEach((keyword) => keywordsFound.add(keyword));
  });

  if (keywordsFound.size > 0) {
    return { sensitive: true, words: Array.from(keywordsFound) };
  }

  return { sensitive: false, words: [] };
}

// Converts blocked keywords into compiled regex patterns.
function compileBlockedRegexes(): void {
  blockedRegexes = blockedKeywords.map(
    (word) => new RegExp(`\\b${escapeRegex(word)}\\b`, "i")
  );
}

// Gathers visible search result elements on the page
function getSearchResults(): HTMLElement[] {
  // Get top-level search results
  const resultsEls = Array.from(resultsContainer.querySelectorAll<HTMLElement>(
  'div[data-hveid][jscontroller]:not([data-processed]):not([data-initq]):has(a h3)'
  )); // :not([data-initq]) excludes "People also ask"

  // Get search results from "People also ask"
  const pplAlsoAskEls = Array.from(resultsContainer.querySelectorAll<HTMLElement>(
    "div[data-q] div[data-ved][data-hveid][class]:not([data-processed]:has(a h3)"
  ));

  return resultsEls.concat(pplAlsoAskEls);
}


// Extracts visible text content from result elements
function extractTextContent(result: HTMLElement): string {
  if (!result) return "";
  const clone = result.cloneNode(true) as HTMLElement;

  // Remove unwanted elements
  clone.querySelectorAll("script, style, head").forEach(el => el.remove());

  return clone.textContent?.trim() || "";
}



// Scans search results and hides those containing blocked keywords.
async function filterSearchResults(): Promise<void> {
  console.time("filterPages");
  const results: HTMLElement[] = getSearchResults().concat(getAIResults());

  results.forEach((result) => {
    const text = extractTextContent(result);
    const processedText = processText(text);
    const keywordsFound = getBlockedKeywords(processedText);

    if (keywordsFound.length > 0) filterResult(result, keywordsFound);
    
    result.setAttribute("data-processed", "true");
  });

  console.timeEnd("filterPages");
}

// Filters Google AI results **FEATURE ONLY WORKS IN ENGLISH**
function getAIResults(): HTMLElement[] {
  const AIresults = Array.from(document.querySelectorAll('div[jsname][data-rl]:not([data-processed])')) as HTMLElement[];
    
  AIresults.forEach(div => div.setAttribute("data-processed", "true"));
  
  return AIresults;
}

// Normalizes and sanitizes text for keyword matching
function processText(text: string): string {
  return text.toLowerCase().replace(/[.,:;()"*?!/]/g, "");
}

// Checks if a string contains any blocked keyword using regexes.
function getBlockedKeywords(str: string): string[] {
  const keywordsFound = new Set<string>();
  for (let i = 0; i < blockedRegexes.length; i++) {
    if (blockedRegexes[i].test(str)) {
      keywordsFound.add(blockedKeywords[i]);
    }
  }
  return Array.from(keywordsFound);
}

// Escapes special regex characters in a string
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let resultNum = 0;
// Hides and replaces a sensitive search result with a warning and a reveal button
function filterResult(result: HTMLElement, keywordsFound: string[]): void {
  result.textContent = "";

  const heading = document.createElement("h3");
  heading.textContent = "This result may be triggering";
  result.appendChild(heading);

  const button = document.createElement("button");
  button.id = `view-keywords-btn-${resultNum}`;
  button.textContent = "View triggering word(s)";
  result.appendChild(button);

  const paragraph = document.createElement("p");
  paragraph.id = `${resultNum}-result`;
  paragraph.textContent = keywordsFound.join(", ");
  result.appendChild(paragraph);

  result.classList.add("blocked-result");
  resultNum++;
}

// Toggle keyword visibility on user click
document.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target?.id?.includes("view-keywords-btn")) {
    const pEl = target.nextElementSibling as HTMLElement;
    toggleKeywordVisibility(pEl, target);
  }
});

// Shows or hides the blocked keywords when user clicks the button
function toggleKeywordVisibility(pEl: HTMLElement, btn: HTMLElement): void {
  const isHidden = pEl.style.display === "none" || pEl.style.display === "";
  pEl.style.setProperty("display", isHidden ? "block" : "none", "important");
  btn.textContent = isHidden
    ? "Hide triggering word(s)"
    : "View triggering word(s)";
}

// Appends the popup warning for sensitive non-Google pages
function appendDOMElements(words: string[]): void {
  const links: { rel: string; href: string; crossorigin?: string }[] = [
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

  const heading = document.createElement("h1");
  heading.textContent = "This webpage may contain triggering content";
  msgContainer.appendChild(heading);

  const button = document.createElement("button");
  button.id = "view-keywords-btn";
  button.textContent = "View triggering word(s)";
  msgContainer.appendChild(button);

  const paragraph = document.createElement("p");
  paragraph.id = "keywords-p";
  paragraph.textContent = words.join(", ");
  msgContainer.appendChild(paragraph);

  document.body.appendChild(msgContainer);
}