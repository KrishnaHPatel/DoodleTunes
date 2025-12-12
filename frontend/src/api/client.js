/**
 * API Client for backend communication
 */
const API_BASE = ''; // Use relative URLs since backend serves frontend

export class ApiClient {
  async generateLyrics(labels, emotion, numLines = 8) {
    const response = await fetch(`${API_BASE}/api/generate-lyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labels,
        emotion,
        num_lines: numLines
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate lyrics');
    }

    return await response.json();
  }

  async render(lyricsLines, mood) {
    const response = await fetch(`${API_BASE}/api/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lyricsLines,
        mood
        // Voice is automatically selected based on mood
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to render');
    }

    return await response.json();
  }
}

