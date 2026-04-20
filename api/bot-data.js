// api/bot-data.js
// Menerima data yang dipush dari bot

let botData = {
    stats: {},
    users: [],
    groups: [],
    commands: [],
    lastUpdate: null
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bot-Secret')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // GET: Ambil data (untuk frontend)
    if (req.method === 'GET') {
        return res.status(200).json(botData)
    }
    
    // POST: Terima data dari bot
    if (req.method === 'POST') {
        const secret = req.headers['x-bot-secret']
        
        // Verifikasi secret (opsional, bisa disesuaikan)
        if (secret !== process.env.BOT_SECRET && secret !== 'bot-secret-key') {
            return res.status(401).json({ error: 'Unauthorized' })
        }
        
        const data = req.body
        
        // Update data
        botData = {
            ...data,
            lastUpdate: new Date().toISOString()
        }
        
        // Simpan ke memory (Vercel serverless)
        // Untuk persistensi, bisa pakai Upstash Redis atau Vercel KV
        
        return res.status(200).json({ 
            success: true, 
            message: 'Data received',
            timestamp: new Date().toISOString()
        })
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
