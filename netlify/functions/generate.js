exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let nische, angebot;
  try {
    const body = JSON.parse(event.body);
    nische = body.nische;
    angebot = body.angebot;
  } catch {
    return { statusCode: 400, body: "Ungültige Anfrage." };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API Key fehlt" }),
    };
  }

  const systemPrompt = `Tool-Strategin für Online-Unternehmerinnen. Erstelle 5 KI-Tool-Ideen für Nische: "${nische}", Angebot: "${angebot}". Nur Claude Artifacts (Generator, Quiz, Rechner, Chatbot, Checkliste). Divers. Kein SaaS. NUR JSON zurückgeben, kein Text davor/danach.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: "Generiere 5 Tool-Ideen als JSON-Array. Felder: name (max 4 Woerter), beschreibung (2 Saetze), toolTyp, funnelPosition (Lead-Magnet/Kurs-Bonus/Launch-Tool/Onboarding/Community-Tool), wasEsTut (Gibt ein: X - bekommt raus: Y), claudePrompt (3 Saetze Bauanleitung als React Artifact, Deutsch, ohne Farben, beginnt mit: Erstelle ein interaktives React Artifact). Format: [{\"name\":\"\",\"beschreibung\":\"\",\"toolTyp\":\"\",\"funnelPosition\":\"\",\"wasEsTut\":\"\",\"claudePrompt\":\"\"}]" }],
      }),
    });

    clearTimeout(timeout);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API-Fehler: " + err.message }),
    };
  }
};
