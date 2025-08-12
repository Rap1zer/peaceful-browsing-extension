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

2. Install dependencies and build the extension:

```bash
npm install
npm run build
```

3. Open Chrome and go to `chrome://extensions/`.
4. Enable **Developer mode** (toggle at the top right).
5. Click **Load unpacked** and select the cloned repository folder (the folder that contains `manifest.json`).

---

## Privacy and Permissions
The extension requires broad host permissions so it can scan the content of webpages you visit. These permissions are used only to detect keywords and to block/hide triggering content. **It does not collect or use any user data.**

## Data sources & attribution

The keyword list `public/medicinenet-diseases.json` included in this repository was derived from the following public dataset:

- **medicinenet-diseases.json** — originally created and published in the `web-scrapers` repository by Shivanshu Gupta on GitHub. The original source is available [here](https://github.com/Shivanshu-Gupta/web-scrapers).

This dataset in the original repository is released under the **MIT License**. To comply with that license we include this attribution and [a copy of the MIT license in this repository](/third_party_licenses/medicinenet-NOTICE.txt).

## Disclaimer
This extension is designed to help reduce exposure to illness-related content for individuals with health anxiety and hypochondria. It is not intended to provide medical advice, diagnosis, or treatment.