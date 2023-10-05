const siteInput = document.getElementById("site-input");
const pauseBtn = document.getElementById("pause-btn");

document.addEventListener("click", (e) => {
  if (e.target.id === "block-a-site-btn") {
    window.location.href = "block-site.html";
  } else if (e.target.id === "remove-blocked-sites-btn") {
    window.location.href = "remove-blocked-sites.html";
  } else if (e.target.id === "filter-a-keyword-btn") {
    window.location.href = "filter-keyword.html";
  } else if (e.target.id === "remove-filtered-keywords-btn") {
    window.location.href = "remove-filtered-keywords.html";
  }
});
