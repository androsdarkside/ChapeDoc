import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing in Vercel settings.' });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Configuration ultra-simple du modèle
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // On fusionne l'instruction système avec la demande de l'utilisateur
        const finalPrompt = "You are an expert document drafter. You must ALWAYS output your response in clean, raw HTML format (using h1, h2, p, strong, em, ul, li). Never use markdown formatting or code blocks.\n\nDocument topic: " + prompt;

        // Génération du contenu
        const result = await model.generateContent(finalPrompt);
        const aiText = result.response.text();
        
        // Nettoyage du texte
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/\n?```$/, '');

        res.status(200).json({ text: cleanText });
        
    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: error.message || 'Server crashed while contacting AI.' });
    }
}