(function () {
  const cfg = window.FISH_LIGHT_CONFIG || {};

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && typeof value === "string") el.textContent = value;
  }

  function setHref(id, value) {
    const el = document.getElementById(id);
    if (el && typeof value === "string") el.setAttribute("href", value);
  }

  function setIframeSrc(id, value) {
    const el = document.getElementById(id);
    if (el && typeof value === "string") el.setAttribute("src", value);
  }

  setText("site-title", cfg.title || "fish-light");
  setText("site-desc", cfg.description || "");

  const viewerPath = cfg.viewerPath || "../fish-light-viewer.html";
  setHref("open-viewer", viewerPath);

  const embed = cfg.embedViewer !== false;
  const frame = document.getElementById("viewer-frame");
  const placeholder = document.getElementById("embed-disabled");

  if (embed) {
    if (placeholder) placeholder.style.display = "none";
    if (frame) {
      frame.style.display = "block";
      setIframeSrc("viewer-frame", viewerPath);
    }
  } else {
    if (frame) frame.style.display = "none";
    if (placeholder) placeholder.style.display = "block";
  }
})();
