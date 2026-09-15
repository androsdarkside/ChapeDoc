export default async function handler(req, res) {
    // On garde l'autorisation POST pour que votre bouton fonctionne
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
    
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) return res.status(500).json({ error: '🚨 CLÉ API INTROUVABLE DANS VERCEL.' });

    try {
        // Au lieu de générer du texte, on demande à Google la liste de vos accès
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ error: `🛑 BLOCAGE GOOGLE : ${data.error?.message}` });
        }

        // On extrait les noms des modèles autorisés
        let listeModeles = "Aucun modèle trouvé.";
        if (data.models && data.models.length > 0) {
            listeModeles = data.models.map(m => `<li><strong>${m.name}</strong></li>`).join('');
        } else {
            listeModeles = `<code>${JSON.stringify(data)}</code>`;
        }

        // On formate la réponse en HTML pour l'afficher directement dans votre éditeur Quill !
        const htmlOutput = `
            <h2>🕵️ Diagnostic de votre Clé API Google</h2>
            <p>Voici la liste exacte des modèles que cette clé a le droit d'utiliser :</p>
            <ul>${listeModeles}</ul>
        `;

        return res.status(200).json({ text: htmlOutput });

    } catch (error) {
        return res.status(500).json({ error: `💥 CRASH : ${error.message}` });
    }
}