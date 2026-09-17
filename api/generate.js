export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, actionType, audience, tone } = req.body;
    
    const keys = {
        gemini: process.env.GEMINI_API_KEY,
        groq: process.env.GROQ_API_KEY
    };

    let errorsTrace = [];

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

        // Fonction 1 : Gemini (Modèle standard officiel)
        async function callGemini() {
            if (!keys.gemini) throw new Error("Clé Gemini introuvable dans Vercel");
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.gemini}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Erreur interne Gemini");
            return data.candidates[0].content.parts[0].text;
        }

        // Fonction 2 : Groq (Modèle Llama 3.3 stable et ultra-puissant)
        async function callGroq() {
            if (!keys.groq) throw new Error("Clé Groq introuvable dans Vercel");
            const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keys.groq}` },
                body: JSON.stringify({ 
                    model: "llama-3.3-70b-versatile", 
                    messages: [{ role: "user", content: finalPrompt }] 
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Erreur interne Groq");
            return data.choices[0].message.content;
        }

        // --- TENTATIVES EN CASCADE ---
        try {
            const aiText = await callGemini();
            const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
            return res.status(200).json({ text: cleanText });
            
        } catch (errGemini) {
            errorsTrace.push(`Gemini: ${errGemini.message}`);
            
            try {
                const aiText = await callGroq();
                const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
                return res.status(200).json({ text: cleanText });
                
            } catch (errGroq) {
                errorsTrace.push(`Groq: ${errGroq.message}`);
                return res.status(500).json({ error: `Crash détaillé -> ${errorsTrace.join(' | ')}` });
            }
        }

    } catch (error) {
        return res.status(500).json({ error: `Erreur serveur: ${error.message}` });
    }
}