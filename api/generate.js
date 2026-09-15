export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE DANS VERCEL.' });

    try {
        let templateInstructions = "";
        
        if (style === 'corporate') {
            templateInstructions = "Rédige un rapport d'entreprise de niveau professionnel supérieur. Commence par une page de garde élégante (Titre percutant en h1, sous-titre, et blocs d'informations pour l'auteur et la date). Ensuite, structure le corps du texte avec des titres de niveau 2 (h2) pour chaque grande partie, des paragraphes argumentés et des listes à puces claires.";
        } else if (style === 'academic') {
            templateInstructions = "Rédige un document académique de type mémoire ou rapport de recherche. Intègre une page de garde formelle, une introduction structurée, des sections numérotées avec des balises h2, et une conclusion rigoureuse.";
        } else {
            templateInstructions = "Rédige un document moderne, épuré et percutant, avec un en-tête stylisé et une mise en page très aérée.";
        }

        const finalPrompt = `You are an expert document designer and professional drafter. ${templateInstructions} You must ALWAYS output your response in clean, raw HTML format using proper tags (h1, h2, p, strong, em, ul, li). Never use markdown formatting or code blocks.\n\nDocument topic: ${prompt}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: finalPrompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: `🛑 BLOCAGE GOOGLE : ${data.error?.message}` });
        }

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        return res.status(200).json({ text: cleanText });

    } catch (error) {
        return res.status(500).json({ error: `💥 CRASH : ${error.message}` });
    }
}