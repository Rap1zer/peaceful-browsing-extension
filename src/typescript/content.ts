console.log("Extension script loaded.");

let blockedKeywords: string[] = [];
let blockedRegexes: RegExp[] = [];
let isBlocked = false;

// Retrieves the blocked keywords from chrome.storage.local
async function fetchBlockedKeywords(): Promise<void> {
  try {
    console.log("Fetching blocked keywords from storage...");
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
    console.log("Blocked keywords fetched:", blockedKeywords);
  } catch (error) {
    console.error("Error fetching blocked keywords:", error);
  }
}

// Initialize the extension
(async () => {
  console.log("Initializing extension...");
  const data = await new Promise<{ isBlockerPaused?: boolean }>((resolve) => {
    chrome.storage.sync.get(["isBlockerPaused"], (items) => {
      resolve(items);
    });
  });
  console.log("Blocker paused status:", data.isBlockerPaused);
  if (data.isBlockerPaused) {
    console.log("Blocker is paused. Exiting initialization.");
    return;
  }

  await fetchBlockedKeywords();

  if (
    window.location.hostname === "www.google.com" &&
    window.location.pathname === "/search"
  ) {
    console.log("On Google Search results page.");
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

function appendGoogleLinks(links: { rel: string; href: string; crossorigin?: string }[]): void {
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

async function isPageSensitive(): Promise<{ sensitive: boolean; words: string[] }> {
  console.log("Running page sensitivity check...");
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
    const keyword = hasBlockedKeyword(processed);
    if (keyword) keywordsFound.add(keyword);
  });

  if (keywordsFound.size > 0) {
    console.log("Page contains sensitive keywords:", keywordsFound);
    return { sensitive: true, words: Array.from(keywordsFound) };
  }

  console.log("No sensitive keywords found on page.");
  return { sensitive: false, words: [] };
}

function compileBlockedRegexes(): void {
  blockedRegexes = blockedKeywords.map(
    (word) => new RegExp(`\\b${escapeRegex(word)}\\b`, "i")
  );
}

function getSearchResults(): HTMLElement[] {
  const h3Elements = document.querySelectorAll<HTMLElement>(
    '#rso a > h3:not([data-processed]), #rso a [aria-level="3"][role="heading"]:not([data-processed])'
  );
  const resultElements = new Set<HTMLElement>();
  console.log("Found h3 elements:", h3Elements);

  h3Elements.forEach((h3) => {
    let container: HTMLElement | null = h3.closest("div");
    const anchorText = container?.querySelector("a")?.textContent || "";
    while (container && container !== document.body) {
      if (
        container.classList.contains("safe-el") ||
        container.classList.contains("blocked-result")
      )
        break;

      const containerChildren = container.querySelectorAll("div, span");

      const hasTextOutsideH3 = Array.from(containerChildren).some((el) => {
        const text = el.textContent?.trim() || "";
        return (
          text.length > 30 &&
          !anchorText.includes(text) &&
          !el.contains(h3) &&
          el !== h3
        );
      });

      if (hasTextOutsideH3) {
        resultElements.add(container);
        break;
      }

      container = container.parentElement;
    }

    h3.setAttribute("data-processed", "true");
  });

  return Array.from(resultElements);
}

function extractTextNodes(result: HTMLElement): string[] {
  const texts: string[] = [];

  result.querySelectorAll("h3, span, div").forEach((el) => {
    if (!el.closest("script, style, head") && el.textContent?.trim()) {
      texts.push(el.textContent.trim());
    }
  });

  return texts;
}

async function filterPages(): Promise<void> {
  console.time("filterPages");
  const results = getSearchResults();
  console.log(`Found ${results.length} new results.`);

  results.forEach((result) => {
    const textBlocks = extractTextNodes(result);
    const keywordsFound = new Set<string>();

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

  console.timeEnd("filterPages");
  console.log("Finished filtering search results.");
}

function processText(text: string): string {
  return text.toLowerCase().replace(/[.,:;()"*?!/]/g, "");
}

function hasBlockedKeyword(str: string): string | undefined {
  for (let i = 0; i < blockedRegexes.length; i++) {
    if (blockedRegexes[i].test(str)) {
      return blockedKeywords[i];
    }
  }
  return undefined;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

let resultNum = 0;
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

document.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target?.id.includes("view-keywords-btn")) {
    const pEl = target.nextElementSibling as HTMLElement;
    toggleKeywordVisibility(pEl, target);
  }
});

function toggleKeywordVisibility(pEl: HTMLElement, btn: HTMLElement): void {
  const isHidden = pEl.style.display === "none" || pEl.style.display === "";
  pEl.style.setProperty("display", isHidden ? "block" : "none", "important");
  btn.textContent = isHidden
    ? "Hide triggering word(s)"
    : "View triggering word(s)";
}

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
  console.log("Popup appended to the DOM.");
}
