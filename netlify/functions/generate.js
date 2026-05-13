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
    return { statusCode: 400, body: JSON.stringify({ error: "Ungültige Anfrage" }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API Key fehlt" }),
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: "Tool-Strategin für Online-Unternehmerinnen. Erstelle 5 KI-Tool-Ideen. NUR JSON zurückgeben.",
        messages: [{ role: "user", content: "Nische: " + nische + ". Angebot: " + angebot + ". Generiere 5 Tool-Ideen als JSON-Array. Felder: name, beschreibung (2 Saetze), toolTyp, funnelPosition (Lead-Magnet/Kurs-Bonus/Launch-Tool/Onboarding/Community-Tool), wasEsTut (Gibt ein: X - bekommt raus: Y), claudePrompt (beginnt mit: Erstelle ein interaktives React Artifact). Format: [{\"name\":\"\",\"beschreibung\":\"\",\"toolTyp\":\"\",\"funnelPosition\":\"\",\"wasEsTut\":\"\",\"claudePrompt\":\"\"}]" }],
      }),
    });

    const data = await response.json();

    // Pass full response back including any errors
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
