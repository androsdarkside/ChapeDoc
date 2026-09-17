export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, actionType, audience, tone } = req.body;
    
    // Récupération de toutes vos clés depuis Vercel
    const keys = {
        gemini: process.env.GEMINI_API_KEY,
        groq: process.env.GROQ_API_KEY,
        cohere: process.env.COHERE_API_KEY,
        huggingface: process.env.HUGGINGFACE_API_KEY
    };

    try {
        let finalPrompt = "";
        
        // --- LOGIQUE DU PROMPT (Identique à votre version précédente) ---
        switch (actionType) {
            case 'plan':
                finalPrompt = `Agis en tant qu'ingénieur en conception. Élabore un plan extrêmement détaillé. Ne rédige AUCUN paragraphe de contenu. Renvoie uniquement le plan en texte brut.\n\nSujet : "${prompt}"`;
                break;
            case 'full_from_plan':
                finalPrompt = `Agis en tant qu'expert. Rédige un document extrêmement exhaustif en te basant sur le plan. Public: ${audience}. Ton: ${tone}.\n\n${prompt}\n\nRAPPEL STRICT: Réponds UNIQUEMENT en HTML brut (<h1>, <p>, <ul>...). Pas de markdown.`;
                break;
            default:
                finalPrompt = `Rédige un contenu sur : "${prompt}". Renvoie ta réponse en HTML brut, sans markdown.`;
                break;
        }

        // --- DÉFINITION DES FOURNISSEURS D'IA ---

        const providers = [
            async function callGemini() {
                if (!keys.gemini) throw new Error("No key");
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys.gemini}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
                });
                if (!res.ok) throw new Error("Gemini failed");
                const data = await res.json();
                return data.candidates[0].content.parts[0].text;
            },
            
            async function callGroq() {
                if (!keys.groq) throw new Error("No key");
                const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keys.groq}` },
                    body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: finalPrompt }] })
                });
                if (!res.ok) throw new Error("Groq failed");
                const data = await res.json();
                return data.choices[0].message.content;
            },

            async function callCohere() {
                if (!keys.cohere) throw new Error("No key");
                const res = await fetch('https://api.cohere.ai/v1/generate', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keys.cohere}` },
                    body: JSON.stringify({ model: 'command', prompt: finalPrompt, max_tokens: 4000 })
                });
                if (!res.ok) throw new Error("Cohere failed");
                const data = await res.json();
                return data.generations[0].text;
            },

            async function callHuggingFace() {
                if (!keys.huggingface) throw new Error("No key");
                const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${keys.huggingface}` },
                    body: JSON.stringify({ inputs: finalPrompt, parameters: { max_new_tokens: 4000 } })
                });
                if (!res.ok) throw new Error("HuggingFace failed");
                const data = await res.json();
                return data[0].generated_text.replace(finalPrompt, ""); // Retire le prompt de la réponse
            }
        ];

        // --- LA CASCADE (WATERFALL) ---
        let aiText = null;
        let lastError = "";

        for (const provider of providers) {
            try {
                aiText = await provider();
                if (aiText) break; // Succès ! On sort de la boucle.
            } catch (err) {
                console.warn("Un fournisseur a échoué, passage au suivant...");
                lastError = err.message;
                continue; // Échec, on passe au fournisseur suivant.
            }
        }

        // Si toutes les IA ont échoué
        if (!aiText) {
            return res.status(500).json({ error: "Toutes nos intelligences artificielles sont actuellement saturées. Veuillez réessayer dans un instant." });
        }

        // Nettoyage final du HTML
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        return res.status(200).json({ text: cleanText });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}