(() => {
  const labelsEl = document.getElementById("labels");
  const emotionEl = document.getElementById("emotion");
  const generateBtn = document.getElementById("generate");
  const generateLabel = generateBtn.querySelector(".btn-label");
  const generateSpinner = generateBtn.querySelector(".spinner");
  const statusEl = document.getElementById("status");
  const resultEl = document.getElementById("result");
  const lyricsEl = document.getElementById("lyrics");
  const metaEl = document.getElementById("meta");
  const thumbUpBtn = document.getElementById("thumbUp");
  const thumbDownBtn = document.getElementById("thumbDown");

  let lastRequest = null;
  let isLoading = false;

  function setLoading(loading, msg = "") {
    isLoading = loading;
    generateBtn.disabled = loading;
    generateBtn.classList.toggle("loading", loading);
    thumbUpBtn.disabled = loading;
    thumbDownBtn.disabled = loading;
    statusEl.textContent = msg;
  }

  async function callGenerate(req) {
    setLoading(true, "Generating lyrics...");
    try {
      const res = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      showResult(data);
      statusEl.textContent = "Done.";
    } catch (err) {
      statusEl.textContent = "Error generating lyrics. Check server logs.";
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function showResult(data) {
    resultEl.style.display = "block";
    lyricsEl.textContent = data.lyrics || "(no lyrics returned)";
    lyricsEl.classList.remove("fade-in");
    // trigger reflow to restart animation
    void lyricsEl.offsetWidth;
    lyricsEl.classList.add("fade-in");

    // Render meta as chips
    const chips = [];
    if (Array.isArray(data.labels)) chips.push(`<span class="chip">Labels: ${data.labels.join(", ")}</span>`);
    if (data.emotion) chips.push(`<span class="chip">Mood: ${data.emotion}</span>`);
    if (data.source) chips.push(`<span class="chip">Source: ${data.source}</span>`);
    if (data.model) chips.push(`<span class="chip">Model: ${data.model}</span>`);
    metaEl.innerHTML = chips.join("");
  }

  function parseLabels(str) {
    return (str || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  generateBtn.addEventListener("click", () => {
    const req = {
      labels: parseLabels(labelsEl.value),
      emotion: (emotionEl.value || "happy").trim(),
      num_lines: 8,
    };
    lastRequest = req;
    callGenerate(req);
  });

  thumbUpBtn.addEventListener("click", () => {
    // For now, just acknowledge. Could be extended to save feedback.
    statusEl.textContent = "Thanks for the feedback! (👍)";
  });

  thumbDownBtn.addEventListener("click", () => {
    if (!lastRequest || isLoading) return;
    statusEl.textContent = "Regenerating...";
    callGenerate(lastRequest);
  });
})(); 


