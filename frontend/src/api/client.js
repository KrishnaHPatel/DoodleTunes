/**
 * API Client for backend communication
 */
const API_BASE = 'http://localhost:5000';

export class ApiClient {
  async render(lyricsLines, mood) {
    const response = await fetch(`${API_BASE}/api/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lyricsLines,
        mood
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to render');
    }

    return await response.json();
  }
}

