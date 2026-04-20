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
        
        const response = await axios.get(`${BOT_API_URL}/api/groups`, {
            headers: { 'x-api-key': API_KEY },
            timeout: 10000
        })
        
        res.status(200).json(response.data)
    } catch (error) {
        console.error('Error fetching groups:', error.message)
        res.status(500).json({ error: error.message })
    }
}
