exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let tool, nische, angebot;
  try {
    const body = JSON.parse(event.body);
    tool    = body.tool;
    nische  = body.nische;
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

  const userPrompt = `Schreibe einen präzisen Claude-Prompt der ein interaktives React Artifact baut.

Tool: ${tool.name}
Was es macht: ${tool.beschreibung}
Typ: ${tool.toolTyp}
Einsatz: ${tool.funnelPosition}
Logik: ${tool.wasEsTut}
Zielgruppe-Nische: ${nische}
Kontext-Angebot: ${angebot}

Regeln für den Prompt:
- Beginnt zwingend mit: "Erstelle ein interaktives React Artifact"
- Beschreibt genau was der Nutzer eingibt und was rauskommt
- Gibt konkrete UI-Elemente vor (Felder, Buttons, Ergebnis-Bereich)
- Erwähnt die Zielgruppe
- Kein Design, keine Farben, keine Schriften
- Deutsch
- Max 6 Sätze
- Nur den Prompt ausgeben, kein Kommentar davor oder danach`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

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
        max_tokens: 600,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    clearTimeout(timeout);
    const data = await response.json();
    const promptText = data.content?.map(i => i.text || "").join("") || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ prompt: promptText }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
