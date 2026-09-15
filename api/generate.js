export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const { prompt, style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE DANS VERCEL.' });

    try {
        let structureGuide = "";
        if (style === 'corporate') {
            structureGuide = "Transforme et adapte les notes fournies en un profil d'entreprise professionnel de type 'Company Profile'. Commence par une page de garde élégante (Titre de l'entreprise, sous-titre, date, auteur: Wilfried KOFFI). Ensuite, organise le texte en grandes sections claires avec des balises h1 et h2 (ex: Introduction, About the Company, Mission and Vision, Products and Services, Financial Performance, Contact Information), en utilisant des listes à puces (ul/li) pour les détails.";
        } else {
            structureGuide = "Organise et réécris le texte brut fourni pour en faire un document formel et structuré, avec une introduction, un corps bien découpé avec des balises h1/h2, et une conclusion.";
        }

        const finalPrompt = `You are an expert document formatter. ${structureGuide}\n\nVoici le texte brut et les notes de l'utilisateur à intégrer et structurer :\n"${prompt}"\n\nTu dois TOUJOURS renvoyer ta réponse au format HTML brut (utilisant h1, h2, p, strong, ul, li). N'utilise jamais de balises markdown ou de blocs de code.`;

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