import axios from 'axios'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    const { page = 1, limit = 50, search = '' } = req.query
    
    try {
        const BOT_API_URL = process.env.BOT_API_URL
        const API_KEY = process.env.API_KEY
        
        let url = `${BOT_API_URL}/api/users?page=${page}&limit=${limit}`
        
        const response = await axios.get(url, {
            headers: { 'x-api-key': API_KEY },
            timeout: 10000
        })
        
        // Jika ada search, filter di sini
        let users = response.data
        if (search) {
            const searchRes = await axios.get(`${BOT_API_URL}/api/search/${search}`, {
                headers: { 'x-api-key': API_KEY },
                timeout: 10000
            })
            users = { users: searchRes.data, total: searchRes.data.length }
        }
        
        res.status(200).json(users)
    } catch (error) {
        console.error('Error fetching users:', error.message)
        res.status(500).json({ error: error.message })
    }
}
