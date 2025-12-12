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
  const nextBtn = document.getElementById("next-btn");

  let lastRequest = null;
  let isLoading = false;
  let likedLyrics = null;

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
    void lyricsEl.offsetWidth;
    lyricsEl.classList.add("fade-in");

    // Render meta as chips
    const chips = [];
    if (Array.isArray(data.labels)) chips.push(`<span class="chip">Labels: ${data.labels.join(", ")}</span>`);
    if (data.emotion) chips.push(`<span class="chip">Mood: ${data.emotion}</span>`);
    if (data.source) chips.push(`<span class="chip">Source: ${data.source}</span>`);
    if (data.model) chips.push(`<span class="chip">Model: ${data.model}</span>`);
    metaEl.innerHTML = chips.join("");

    // Reset like state
    likedLyrics = null;
    nextBtn.classList.remove("show");
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
    if (!lyricsEl.textContent || lyricsEl.textContent === "(no lyrics returned)") {
      return;
    }
    
    // Store liked lyrics data
    likedLyrics = {
      lyrics: lyricsEl.textContent,
      labels: lastRequest ? lastRequest.labels : [],
      emotion: lastRequest ? lastRequest.emotion : emotionEl.value,
      meta: metaEl.innerHTML
    };
    
    // Store in localStorage for next page
    localStorage.setItem('doodletunes_lyrics', JSON.stringify(likedLyrics));
    
    // Show Next button
    nextBtn.classList.add("show");
    statusEl.textContent = "Lyrics saved! Click Next to continue.";
  });

  thumbDownBtn.addEventListener("click", () => {
    if (!lastRequest || isLoading) return;
    statusEl.textContent = "Regenerating...";
    callGenerate(lastRequest);
  });

  nextBtn.addEventListener("click", () => {
    if (likedLyrics) {
      window.location.href = "playback.html";
    }
  });

  // Check if there's already liked lyrics (in case user navigated back)
  const stored = localStorage.getItem('doodletunes_lyrics');
  if (stored) {
    try {
      likedLyrics = JSON.parse(stored);
      nextBtn.classList.add("show");
    } catch (e) {
      console.error("Failed to parse stored lyrics", e);
    }
  }
})();
