export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    // NOUVEAU : On extrait 'audience' et 'tone'
    const { prompt, actionType, audience, tone } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE.' });

    try {
        let finalPrompt = "";

        switch (actionType) {
            case 'reformuler':
                finalPrompt = `Reformule le texte suivant pour qu'il soit plus clair, fluide et naturel. Ne réponds QUE par le nouveau texte.\n\n"${prompt}"`;
                break;
            case 'rallonger':
                finalPrompt = `Développe l'idée du texte suivant en ajoutant des détails et des exemples. Ne réponds QUE par le nouveau texte.\n\n"${prompt}"`;
                break;
            case 'pro':
                finalPrompt = `Réécris le texte suivant en utilisant un vocabulaire très professionnel et formel. Ne réponds QUE par le nouveau texte.\n\n"${prompt}"`;
                break;
            case 'resumer':
                finalPrompt = `Fais un résumé très concis du texte suivant. Ne réponds QUE par le nouveau texte.\n\n"${prompt}"`;
                break;
            case 'plan':
                finalPrompt = `Tu es un expert en structuration de documents. Ton rôle est d'analyser le sujet suivant et de proposer UNIQUEMENT un plan détaillé et logique (avec des titres I, II, III et des sous-titres A, B, C). Ne rédige AUCUN paragraphe de contenu. Renvoie le plan en texte brut clair.\n\nSujet : "${prompt}"`;
                break;
                
            // NOUVEAU : Application stricte du Ton et de l'Audience
            case 'full_from_plan':
                finalPrompt = `Tu es un expert en rédaction professionnelle. Rédige un document exhaustif en te basant EXACTEMENT sur les instructions et le plan fournis ci-dessous.
                
CONSIGNES STRATÉGIQUES ET STYLISTIQUES :
- Public cible visé : ${audience || 'Professionnels'}
- Ton de rédaction : ${tone || 'Formel et rigoureux'}
Tu DOIS impérativement adapter ton vocabulaire, tes arguments et ta manière de t'adresser au lecteur en fonction de ce public et de ce ton.

${prompt}

Tu dois OBLIGATOIREMENT renvoyer ta réponse au format HTML brut (utilise <h1>, <h2>, <h3>, <p>, <ul>, <li>). N'utilise JAMAIS de markdown ou de blocs de code.`;
                break;
                
            default:
                finalPrompt = `Tu es un expert en rédaction de documents. Rédige un contenu structuré sur : "${prompt}". Renvoie ta réponse en HTML brut.`;
                break;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }]
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