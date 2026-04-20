import axios from 'axios'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    try {
        const BOT_API_URL = process.env.BOT_API_URL
        const API_KEY = process.env.API_KEY
        
        if (!BOT_API_URL || !API_KEY) {
            return res.status(500).json({ 
                error: 'Missing configuration',
                message: 'BOT_API_URL or API_KEY not set in environment variables'
            })
        }
        
        const response = await axios.get(`${BOT_API_URL}/api/stats`, {
            headers: { 'x-api-key': API_KEY },
            timeout: 10000
        })
        
        res.status(200).json(response.data)
    } catch (error) {
        console.error('Error fetching stats:', error.message)
        res.status(500).json({ 
            error: 'Failed to fetch stats',
            message: error.message,
            hint: 'Check if BOT_API_URL is correct and bot API server is running'
        })
    }
}
