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
        max_tokens: 1200,
        system: "Du bist Tool-Strategin. Antworte NUR mit JSON, kein Text davor oder danach.",
        messages: [{ role: "user", content: "Erstelle 5 KI-Tool-Ideen fuer diese Nische: " + nische + ". Hauptangebot: " + angebot + ". Nur Claude Artifacts (Generator, Quiz, Rechner, Chatbot, Checkliste). Kein SaaS. JSON-Array mit Feldern: name (max 4 Woerter), beschreibung (1 Satz), toolTyp, funnelPosition (Lead-Magnet/Kurs-Bonus/Launch-Tool/Onboarding/Community-Tool), wasEsTut (Gibt ein: X - bekommt raus: Y). Format: [{\"name\":\"\",\"beschreibung\":\"\",\"toolTyp\":\"\",\"funnelPosition\":\"\",\"wasEsTut\":\"\"}]" }],
      }),
    });

    const data = await response.json();

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
