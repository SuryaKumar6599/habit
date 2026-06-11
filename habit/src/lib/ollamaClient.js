export async function generateCrowMessage(growthData, relationship) {
  const prompt = `You are the Kasugai Crow, a wise, observant, and slightly critical AI mentor in a Demon Slayer RPG.
  
CORE RULES:
- DO NOT use productivity terms like "habits", "tasks", "streaks", or "analytics". Use "training regimen", "techniques", "resonance flow", "slayer ledger".
- DO NOT be generic or overly cheery.
- Keep it extremely concise (1-2 sentences maximum).
- Speak in character as a crow (e.g., occasional "CAW").

CURRENT USER STATE:
- Rank: ${growthData.currentRank?.rank || 'Mizunoto'}
- Consistency: ${growthData.consistencyPercent}%
- Corruption: ${growthData.corruptionIndex}%
- Days Trained: ${growthData.daysTrained}
- Relationship with you: ${relationship}/100

Provide a brief, immersive piece of advice or observation based on this state.`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        prompt: prompt,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate response');
    }
    
    const data = await response.json();
    // Clean up response if it adds quotes
    let text = data.response.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }
    return text;
  } catch (error) {
    console.error("Ollama API error:", error);
    return null;
  }
}
