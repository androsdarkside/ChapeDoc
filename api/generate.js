export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests allowed' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Check 1: Did Vercel load the API key?
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing in Vercel settings.' });
    }

    try {
        // Check 2: Using the stable 1.5-flash model
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                systemInstruction: {
                    parts: [{ text: "You are an expert document drafter. You must ALWAYS output your response in clean, raw HTML format (using h1, h2, p, strong, em, ul, li). Never use markdown formatting and do not wrap the output in markdown code blocks or ```html." }]
                },
                contents: [{ parts: [{ text: prompt }] }] 
            })
        });

        const data = await response.json();
        
        // Check 3: Did Google's API reject our request?
        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return res.status(500).json({ error: data.error?.message || 'Gemini API failed.' });
        }
        
        const aiText = data.candidates[0].content.parts[0].text;
        
        // Failsafe: Remove markdown backticks if the AI accidentally adds them
        const cleanText = aiText.replace(/^```html\n?/, '').replace(/\n?```$/, '');

        res.status(200).json({ text: cleanText });
        
    } catch (error) {
        console.error("Serverless Function Error:", error);
        res.status(500).json({ error: 'Server crashed while contacting AI.' });
    }
}
