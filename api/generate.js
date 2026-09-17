export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, actionType, audience, tone } = req.body;
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
        return res.status(500).json({ error: 'Clé GROQ_API_KEY introuvable dans Vercel.' });
    }

    try {
        let finalPrompt = "";
        
        switch (actionType) {
            case 'plan':
                finalPrompt = `Agis en tant qu'ingénieur en conception. Élabore un plan extrêmement détaillé. Ne rédige AUCUN paragraphe de contenu. Renvoie uniquement le plan en texte brut.\n\nSujet : "${prompt}"`;
                break;
            case 'full_from_plan':
                finalPrompt = `Agis en tant qu'expert. Rédige un document extrêmement exhaustif en te basant sur le plan. Public: ${audience}. Ton: ${tone}.\n\n${prompt}\n\nRAPPEL STRICT: Réponds UNIQUEMENT en HTML brut (<h1>, <p>, <ul>...). Pas de markdown.`;
                break;
            default:
                finalPrompt = `Rédige un contenu détaillé sur : "${prompt}". Renvoie ta réponse en HTML brut, sans markdown.`;
                break;
        }

        // Utilisation du modèle Llama 3.3 officiel et actif chez Groq
        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: finalPrompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Erreur de l'API Groq");

        const aiText = data.choices[0].message.content;
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        
        return res.status(200).json({ text: cleanText });

    } catch (error) {
        return res.status(500).json({ error: `Erreur serveur: ${error.message}` });
    }
}