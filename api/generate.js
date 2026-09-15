export default async function handler(req, res) {
    // 1. Autoriser explicitement la connexion
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Vérification de la clé
    if (!apiKey) {
        return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE : Vercel ne trouve pas GEMINI_API_KEY.' });
    }

    try {
        // 3. Fusion des instructions (Évite les erreurs de format selon les modèles)
        const finalPrompt = "You are an expert document drafter. You must ALWAYS output your response in clean, raw HTML format (using h1, h2, p, strong, em, ul, li). Never use markdown formatting or code blocks.\n\nDocument topic: " + prompt;

        // 4. Appel direct et basique à l'API v1beta avec le modèle flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }]
            })
        });

        const data = await response.json();

        // 5. SI GOOGLE REFUSE : On affiche l'erreur exacte sur votre écran !
        if (!response.ok) {
            const googleError = data.error?.message || JSON.stringify(data);
            return res.status(500).json({ error: `🛑 BLOCAGE GOOGLE : ${googleError}` });
        }

        // 6. Succès
        const aiText = data.candidates[0].content.parts[0].text;
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/\n?```$/, '');

        return res.status(200).json({ text: cleanText });

    } catch (error) {
        // 7. Si le serveur Vercel plante complètement
        return res.status(500).json({ error: `💥 CRASH DU SERVEUR : ${error.message}` });
    }
}