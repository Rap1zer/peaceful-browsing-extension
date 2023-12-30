const siteInput = document.getElementById("site-input");
const pauseBtn = document.getElementById("pause-btn");

document.addEventListener("click", (e) => {
  switch (e.target.id) {
    case "websites-btn":
      window.location.href = "block-websites.html";
      break;
    case "keywords-btn":
      window.location.href = "block-keywords.html";
      break;
    case "pause-blocker-btn":
      // Disable or enable the chrome extension
      break;
    case "pause-once-btn":
      // pause this site once
      break;
  }
});
