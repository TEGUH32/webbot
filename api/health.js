// api/health.js
import axios from 'axios'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers['host']
        const baseUrl = `${protocol}://${host}`
        
        const response = await axios.get(`${baseUrl}/api/bot-data`)
        const data = response.data
        
        res.status(200).json({
            status: 'connected',
            lastUpdate: data.stats?.lastUpdate || null,
            totalUsers: data.stats?.totalUsers || 0,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        res.status(200).json({
            status: 'waiting',
            message: 'Waiting for bot data...',
            timestamp: new Date().toISOString()
        })
    }
}
