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

  const systemPrompt = `Du bist Tool-Strategin für Online-Unternehmerinnen (Coaches, Beraterinnen, Kursanbieterinnen).

Erstelle 5 konkrete KI-Tool-Ideen für:
- Nische: ${nische}
- Hauptangebot: ${angebot}

REGELN:
- Kein SaaS. Nur Tools die als Claude Artifact (HTML/React) umsetzbar sind: Generatoren, Rechner, Analyse-Tools, Checklisten, Quizze, Chatbots, Planer, Scorer
- Die 5 Tools MÜSSEN divers sein: verschiedene Tool-Typen UND verschiedene Funnel-Positionen
- Realistisch ohne Programmierkenntnisse baubar
- Kein Tool darf doppelt sein

Felder pro Tool:
1. name: Kreativer Name (deutsch, max 4 Wörter)
2. beschreibung: Was das Tool macht (2-3 Sätze, konkret)
3. toolTyp: z.B. "Interaktiver Rechner", "KI-Generator", "Quiz", "Analyse-Tool", "Chatbot", "Checkliste", "Planer", "Scorer"
4. funnelPosition: Genau eine: "Lead-Magnet" | "Kurs-Bonus" | "Launch-Tool" | "Onboarding" | "Community-Tool"
5. wasEsTut: Eine Zeile Format: "Gibt ein: [X] – bekommt raus: [Y]"
6. claudePrompt: Fertiger Claude-Prompt zum Bauen als Artifact. Deutsch. Ohne Farben. Nische und Angebot eingebettet. Vollständig – nichts muss ergänzt werden. Mindestens 5 Sätze.

Antworte NUR mit JSON-Array. Null Markdown, null Text davor/danach.
[{"name":"","beschreibung":"","toolTyp":"","funnelPosition":"","wasEsTut":"","claudePrompt":""}]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: "Generiere jetzt die 5 Tool-Ideen als JSON." }],
      }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API-Fehler: " + err.message }),
    };
  }
};
