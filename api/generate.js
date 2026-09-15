export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, templateStructure } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE.' });

    try {
        const finalPrompt = `
        Tu es un assistant de rédaction d'entreprise. 
        Voici la structure HTML exacte d'un modèle de "Company Profile" :
        \`\`\`html
        ${templateStructure}
        \`\`\`
        
        Voici les informations brutes fournies par l'utilisateur :
        "${prompt}"
        
        Ta tâche : Remplis ce modèle HTML en remplaçant les placeholders entre crochets [...] par des textes professionnels rédigés à partir des informations de l'utilisateur.
        CONSIGNE STRICTE : Tu dois renvoyer UNIQUEMENT le code HTML final rempli. Ne change pas les balises <h1> ou <h2>. Ne mets pas de formatage markdown autour de ta réponse.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
        });

        const data = await response.json();
        if (!response.ok) return res.status(500).json({ error: data.error?.message });

        const aiText = data.candidates[0].content.parts[0].text.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        return res.status(200).json({ text: aiText });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}