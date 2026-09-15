export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE DANS VERCEL.' });

    try {
        let templateInstructions = "";
        
        if (style === 'corporate') {
            templateInstructions = "Génère un document d'entreprise formel. Commence OBLIGATOIREMENT par une page de garde HTML structurée de cette manière : un titre principal en h1, un sous-titre en p, puis les métadonnées (Auteur: Wilfried KOFFI, Date: Septembre 2026) encadrées proprement, suivies d'un saut de page ou d'une ligne de séparation, puis les sections du rapport (1. Introduction, 2. Développement, 3. Conclusion).";
        } else if (style === 'academic') {
            templateInstructions = "Génère un document académique rigoureux. Commence OBLIGATOIREMENT par une page de garde académique structurée (Titre du mémoire/projet, Nom de l'auteur: Wilfried KOFFI, Institution, Date), puis structure le contenu avec des sections académiques détaillées.";
        } else {
            templateInstructions = "Génère une lettre ou un document moderne et percutant avec un en-tête soigné, un objet clair et des paragraphes bien aérés.";
        }

        const finalPrompt = `You are an expert document drafter. ${templateInstructions} You must ALWAYS output your response in clean, raw HTML format using proper tags (h1, h2, p, strong, em, ul, li). Never use markdown formatting or code blocks.\n\nDocument topic: ${prompt}`;

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