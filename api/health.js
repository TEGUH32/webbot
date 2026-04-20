import axios from 'axios'

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    try {
        const BOT_API_URL = process.env.BOT_API_URL
        const API_KEY = process.env.API_KEY
        
        // Test koneksi ke bot
        const response = await axios.get(`${BOT_API_URL}/api/health`, {
            headers: { 'x-api-key': API_KEY },
            timeout: 5000
        })
        
        res.status(200).json({
            status: 'connected',
            bot: response.data,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Health check error:', error.message)
        res.status(500).json({
            status: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        })
    }
}
