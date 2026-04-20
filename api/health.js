// api/health.js
// Health check endpoint

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
        
        const response = await fetch(`${baseUrl}/api/bot-data?type=health`)
        const data = await response.json()
        
        res.status(200).json({
            status: 'connected',
            botName: 'Alecia Bot',
            version: '2.0.0 Premium',
            lastUpdate: data.lastUpdate || null,
            stats: {
                totalUsers: data.totalUsers || 0,
                premiumUsers: data.premiumUsers || 0,
                totalGroups: data.totalGroups || 0
            },
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
