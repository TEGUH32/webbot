// api/stats.js
import axios from 'axios'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    try {
        // Ambil dari internal API
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers['host']
        const baseUrl = `${protocol}://${host}`
        
        const response = await axios.get(`${baseUrl}/api/bot-data`)
        const data = response.data
        
        res.status(200).json(data.stats || {
            totalUsers: 0,
            premiumUsers: 0,
            totalGroups: 0,
            activeUsers: 0,
            totalCommands: 0
        })
    } catch (error) {
        console.error('Error fetching stats:', error.message)
        res.status(200).json({
            totalUsers: 0,
            premiumUsers: 0,
            totalGroups: 0,
            activeUsers: 0,
            totalCommands: 0,
            error: 'Waiting for bot data...'
        })
    }
}
