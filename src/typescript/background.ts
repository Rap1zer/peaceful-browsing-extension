let stylingForBlockedSites: string = "/blocked-webpage.css";
let isBlockerPaused: boolean = false;

interface Message {
  type: string;
  keyword?: string;
}

// Initial check for keywords in local storage
chrome.storage.local.get("keywords", (data: { keywords?: string[] }) => {
  if (!data.keywords) initialise();
});

async function initialise(): Promise<void> {
  await chrome.storage.sync.set({ isBlockerPaused: false });
  // Fetch keywords from JSON file and store it in local storage
  try {
    const response = await fetch("/medicinenet-diseases.json");
    const keywordData: string[] = await response.json();
    chrome.storage.local.set({ keywords: keywordData });
  } catch (error) {
    console.error("Error fetching JSON data:", error);
  }
}

chrome.runtime.onMessage.addListener(
  (message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void | boolean => {
    (async () => {
      // Check if the chrome extension is currently paused
      await chrome.storage.sync.get("isBlockerPaused", (data: { isBlockerPaused?: boolean }) => {
        isBlockerPaused = data.isBlockerPaused ?? false;
      });

      // Insert CSS into a webpage
      if (message.type === "insertCSS" && !isBlockerPaused) {
        try {
          if (sender.tab?.id !== undefined) {
            chrome.scripting.insertCSS({
              target: { tabId: sender.tab.id },
              files: [stylingForBlockedSites],
            });
          } else {
            console.error("No valid tab ID to insert CSS.");
          }
        } catch (err) {
          console.error(`Failed to insert CSS: ${err}`);
        }
      }
    })();

    // Block a keyword and insert it into local storage
    if (message.type === "blockKeyword" && message.keyword) {
      const keyword = message.keyword;
      chrome.storage.local.get("keywords", (result: { keywords?: string[] }) => {
        if (keyword.length >= 50) {
          sendResponse({success: false, error: "Input must be 50 characters or less"});
          return;
        } 
        if (result.keywords?.includes(keyword)) { // Keyword already in storage
          sendResponse({success: false, error: `"${keyword}" is already in the list of keywords`});
          return;
        }
        
        const keywordData: string[] = result.keywords ?? [];
        keywordData.push(keyword);
        chrome.storage.local.set({ keywords: keywordData }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({success: false, error: chrome.runtime.lastError.message});
          } else {
            sendResponse({success: true});
          }
        });
      });

      return true;
    }
  }
);
