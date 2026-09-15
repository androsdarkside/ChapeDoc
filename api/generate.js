export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, actionType, audience, tone } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE.' });

    try {
        let finalPrompt = "";

        switch (actionType) {
            case 'reformuler':
                finalPrompt = `Agis en tant qu'expert rédacteur. Reformule le texte suivant de manière magistrale pour qu'il soit d'une clarté absolue, fluide et percutante. Ne réponds QUE par le texte amélioré.\n\n"${prompt}"`;
                break;
            case 'rallonger':
                finalPrompt = `Agis en tant qu'expert rédacteur. Développe l'idée du texte suivant au maximum en argumentant en profondeur, en fournissant des exemples techniques précis et des explications exhaustives. Ne réponds QUE par le texte développé.\n\n"${prompt}"`;
                break;
            case 'pro':
                finalPrompt = `Agis en tant qu'expert en communication d'entreprise. Réécris le texte suivant avec un vocabulaire ultra-professionnel, formel, prestigieux et percutant (niveau direction générale). Ne réponds QUE par le texte réécrit.\n\n"${prompt}"`;
                break;
            case 'resumer':
                finalPrompt = `Fais un résumé analytique, dense et direct qui capture l'essence absolue du texte suivant en quelques phrases clés. Ne réponds QUE par le résumé.\n\n"${prompt}"`;
                break;
            case 'plan':
                finalPrompt = `Agis en tant qu'ingénieur en conception de documents d'élite. Analyse le sujet suivant et élabore un plan extrêmement détaillé, rigoureux et structuré (divisé en grandes parties I, II, III et sous-parties A, B, C avec des sous-points précis). Ne rédige AUCUN paragraphe de contenu. Renvoie uniquement le plan en texte brut clair.\n\nSujet : "${prompt}"`;
                break;
                
            case 'full_from_plan':
                finalPrompt = `Agis en tant qu'expert consultant et rédacteur technique de haut niveau. Rédige un document extrêmement exhaustif, fouillé et d'une qualité professionnelle irréprochable en te basant rigoureusement sur le plan fourni.

CONSIGNES DE PERFORMANCE MAXIMALE :
- Ne fais aucune approximation. Développe chaque sous-partie en profondeur avec un maximum de détails techniques, d'analyses poussées et de rigueur rédactionnelle.
- Public cible : ${audience || 'Professionnels et experts'}
- Ton : ${tone || 'Formel, rigoureux et académique'}

${prompt}

Tu dois OBLIGATOIREMENT renvoyer ta réponse au format HTML brut (utilise <h1>, <h2>, <h3>, <p>, <ul>, <li>). N'utilise JAMAIS de markdown ou de blocs de code.`;
                break;
                
            default:
                finalPrompt = `Agis en tant qu'expert rédacteur. Rédige un contenu extrêmement détaillé et structuré sur : "${prompt}". Renvoie ta réponse en HTML brut.`;
                break;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }],
                // On pousse les paramètres de génération au maximum pour autoriser de très longs textes détaillés
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192, // Capacité maximale de tokens de sortie pour éviter toute coupure
                }
            })
        });

        const data = await response.json();
        if (!response.ok) return res.status(500).json({ error: `🛑 ERREUR GOOGLE : ${data.error?.message}` });

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        return res.status(200).json({ text: cleanText });

    } catch (error) {
        return res.status(500).json({ error: `💥 ERREUR SERVEUR : ${error.message}` });
    }
}