# Peaceful Browsing for Health Anxiety
A Chrome extension which filters sensitive webpages and search results for people with health anxiety and hypochondria.

---

## Overview
It’s all too easy to get caught up googling symptoms. This simple extension aims to help individuals with health anxiety and hypochondria be more mindful while using Google.

The extension scans Google’s search results and meta-information on open webpages for illness-related keywords. If any are detected, the corresponding results will be blocked. 

There are over 3,000 keywords built-in, but you can also add new keywords or remove existing ones from the list.

Please note that the pre-existing list of keywords is not exhaustive and may not detect every illness-related search result or webpage.

---

## Installation

### From Chrome Web Store

[Install from the web store.](https://chromewebstore.google.com/detail/peaceful-browsing-for-hea/jjkmdldnaipgenmhldkdepaakieincfe?hl=en&authuser=0)

### From source

1. Clone this repository:

```bash
git clone https://github.com/yourusername/health-anxiety-filter.git
```

2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (toggle at the top right).
4. Click **Load unpacked** and select the cloned repository folder (the folder that contains `manifest.json`).

> If the extension requires a build step (e.g., bundler or TypeScript), run the build script first: `npm ci` then `npm run build` (or your chosen commands).