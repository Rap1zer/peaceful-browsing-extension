console.log("hi");

document.addEventListener("click", (e) => {
  switch (e.target.id) {
    case "websites-btn":
      window.location.href = "../block-websites.html";
      break;
    case "keywords-btn":
      window.location.href = "../block-keywords.html";
      break;
  }
});
