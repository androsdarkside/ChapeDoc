export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE DANS VERCEL.' });

    try {
        // Définition des consignes de mise en page selon le style choisi
        let styleInstruction = "";
        if (style === 'academic') {
            styleInstruction = "Style académique : Structure le document avec un titre principal, des sections claires (1. Introduction, 2. Développement, 3. Conclusion), un ton formel et des listes à puces bien organisées.";
        } else if (style === 'creative') {
            styleInstruction = "Style moderne et épuré : Utilise un ton accrocheur, des sous-titres dynamiques et une mise en page aérée.";
        } else {
            styleInstruction = "Style professionnel et formel : Utilise une mise en page d'entreprise rigoureuse, un en-tête clair, des sections numérotées et un vocabulaire technique irréprochable.";
        }

        const finalPrompt = `You are an expert document drafter. ${styleInstruction} You must ALWAYS output your response in clean, raw HTML format using proper tags (h1, h2, p, strong, em, ul, li). Never use markdown formatting or code blocks.\n\nDocument topic: ${prompt}`;

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