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
    return { statusCode: 400, body: JSON.stringify({ error: "Ungültige Anfrage" }) };
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
        max_tokens: 500,
        messages: [{ role: "user", content: "Schreibe einen Claude-Prompt der ein interaktives React Artifact baut. Tool: " + tool.name + ". Was es macht: " + tool.beschreibung + ". Typ: " + tool.toolTyp + ". Zielgruppe-Nische: " + nische + ". Regeln: Beginnt mit 'Erstelle ein interaktives React Artifact'. Max 4 Saetze. Deutsch. Ohne Farben. Nur den Prompt ausgeben, kein Kommentar." }],
      }),
    });

    const data = await response.json();
    const promptText = data.content ? data.content.map(function(i) { return i.text || ""; }).join("") : "Fehler beim Generieren.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ prompt: promptText }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
