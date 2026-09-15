export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    // On récupère "actionType" pour savoir ce que l'utilisateur veut faire
    const { prompt, actionType } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE.' });

    try {
        let finalPrompt = "";

        // Logique de l'intelligence artificielle
        switch (actionType) {
            case 'reformuler':
                finalPrompt = `Reformule le texte suivant pour qu'il soit plus clair, fluide et naturel. Ne réponds QUE par le nouveau texte, sans introduction ni conclusion.\n\nTexte à modifier : "${prompt}"`;
                break;
            case 'rallonger':
                finalPrompt = `Développe l'idée du texte suivant en ajoutant des détails pertinents, des exemples ou des arguments, tout en gardant le même sens. Ne réponds QUE par le nouveau texte.\n\nTexte à modifier : "${prompt}"`;
                break;
            case 'pro':
                finalPrompt = `Réécris le texte suivant en utilisant un vocabulaire très professionnel, formel et adapté au monde de l'entreprise (Corporate). Ne réponds QUE par le nouveau texte.\n\nTexte à modifier : "${prompt}"`;
                break;
            case 'resumer':
                finalPrompt = `Fais un résumé très concis et direct du texte suivant en une ou deux phrases maximum. Ne réponds QUE par le nouveau texte.\n\nTexte à modifier : "${prompt}"`;
                break;
            default:
                // Génération classique d'un document complet (actionType: 'main')
                finalPrompt = `Tu es un expert en rédaction de documents. Rédige un contenu détaillé et structuré sur ce sujet : "${prompt}". Tu dois OBLIGATOIREMENT renvoyer ta réponse en HTML propre (avec des balises h1, h2, p, ul, li). N'utilise JAMAIS de markdown ou de blocs de code.`;
                break;
                // NOUVEAU : Mode Architecte - Créer uniquement le plan
            case 'plan':
                finalPrompt = `Tu es un expert en structuration de documents. Ton rôle est d'analyser le sujet suivant et de proposer UNIQUEMENT un plan détaillé et logique (avec des titres I, II, III et des sous-titres A, B, C). Ne rédige AUCUN paragraphe de contenu. Renvoie le plan en texte brut clair (sans HTML et sans markdown).\n\nSujet : "${prompt}"`;
                break;
                
            // NOUVEAU : Mode Architecte - Rédiger à partir du plan
            case 'full_from_plan':
                finalPrompt = `Tu es un expert en rédaction professionnelle. Rédige un document exhaustif, formel et complet en te basant EXACTEMENT sur les instructions et le plan fournis ci-dessous. Développe chaque section en profondeur avec des arguments et du contenu de qualité.\n\n${prompt}\n\nTu dois OBLIGATOIREMENT renvoyer ta réponse au format HTML brut (utilise <h1> pour le titre principal, <h2> pour les grandes parties du plan, <h3> pour les sous-parties, <p> pour le texte, et <ul>/<li> pour les listes). N'utilise JAMAIS de markdown ou de blocs de code.`;
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

        if (!response.ok) {
            return res.status(500).json({ error: `🛑 ERREUR GOOGLE : ${data.error?.message}` });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage du markdown si Google en renvoie accidentellement
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        
        return res.status(200).json({ text: cleanText });

    } catch (error) {
        return res.status(500).json({ error: `💥 ERREUR SERVEUR : ${error.message}` });
    }
}