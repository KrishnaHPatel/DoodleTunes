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
  const thumbDownBtn = document.getElementById("thumbDown");
  const nextBtn = document.getElementById("next-btn");

  let lastRequest = null;
  let isLoading = false;

  function setLoading(loading, msg = "") {
    isLoading = loading;
    generateBtn.disabled = loading;
    generateBtn.classList.toggle("loading", loading);
    thumbDownBtn.disabled = loading;
    nextBtn.disabled = loading;
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

    // Show Next button when lyrics are generated
    if (nextBtn) {
      nextBtn.style.display = "inline-flex";
    }
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

  thumbDownBtn.addEventListener("click", () => {
    if (!lastRequest || isLoading) return;
    statusEl.textContent = "Regenerating...";
    callGenerate(lastRequest);
  });

  nextBtn.addEventListener("click", () => {
    if (!lyricsEl.textContent || lyricsEl.textContent === "(no lyrics returned)") {
      alert("Please generate lyrics first.");
      return;
    }
    
    // Store lyrics data for next page
    const lyricsData = {
      lyrics: lyricsEl.textContent,
      labels: lastRequest ? lastRequest.labels : [],
      emotion: lastRequest ? lastRequest.emotion : emotionEl.value,
      meta: metaEl.innerHTML
    };
    
    // Store in localStorage for next page
    localStorage.setItem('doodletunes_lyrics', JSON.stringify(lyricsData));
    
    // Navigate to playback page
    window.location.href = "playback.html";
  });
  
  // Load labels from localStorage if coming from drawing page
  window.addEventListener('DOMContentLoaded', () => {
    const savedLabels = localStorage.getItem('doodletunes_labels');
    const savedMood = localStorage.getItem('doodletunes_mood');
    
    if (savedLabels) {
      try {
        const labels = JSON.parse(savedLabels);
        if (labels.length > 0) {
          labelsEl.value = labels.join(", ");
        }
      } catch (e) {
        console.error("Error loading labels:", e);
      }
    }
    
    if (savedMood && emotionEl) {
      emotionEl.value = savedMood;
    }
  });

  // Check if there's already lyrics (in case user navigated back)
  const stored = localStorage.getItem('doodletunes_lyrics');
  if (stored) {
    try {
      const lyricsData = JSON.parse(stored);
      // If lyrics exist, show them and enable Next button
      if (lyricsData.lyrics) {
        lyricsEl.textContent = lyricsData.lyrics;
        resultEl.style.display = "block";
        if (nextBtn) {
          nextBtn.style.display = "inline-flex";
        }
      }
    } catch (e) {
      console.error("Failed to parse stored lyrics", e);
    }
  }
  
  // Load labels on page load (mood is selected on this page, not from page 1)
  const savedLabels = localStorage.getItem('doodletunes_labels');
  
  if (savedLabels) {
    try {
      const labels = JSON.parse(savedLabels);
      if (labels.length > 0 && labelsEl) {
        labelsEl.value = labels.join(", ");
      }
    } catch (e) {
      console.error("Error loading labels:", e);
    }
  }
})();
