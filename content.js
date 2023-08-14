// Check if the current page is a Google Search page
if (
  window.location.hostname === "www.google.com" &&
  window.location.pathname === "/search"
) {
  // List of keywords to filter out
  const keywordsToFilter = [
    //  "anxiety",
    //  "symptoms",
    //  "worried",
    //  "diagnosis",
    //  "rash",
    //  "rashes",
  ];

  // Select and remove search results with unwanted keywords
  const searchResults = document.querySelectorAll('[class^="g"]');
  //console.log(searchResults);
  searchResults.forEach((result) => {
    const titleElement = result.querySelector("h3");
    if (titleElement) {
      const title = titleElement.textContent.toLowerCase();
      if (keywordsToFilter.some((keyword) => title.includes(keyword))) {
        result.remove();
      }
    }
  });
}
