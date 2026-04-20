// api/check-user.js
// Cek apakah user sudah terdaftar

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    const { number } = req.query
    
    if (!number) {
        return res.status(400).json({ error: 'Nomor WhatsApp required' })
    }
    
    try {
        const botApiUrl = process.env.BOT_API_URL || 'http://localhost:5000'
        const apiKey = process.env.API_KEY
        
        const response = await fetch(`${botApiUrl}/api/check-user?number=${number}`, {
            headers: { 'x-api-key': apiKey }
        })
        
        const result = await response.json()
        
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
