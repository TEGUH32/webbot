// api/health.js
// Health check endpoint

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    try {
        // Ambil data dari bot-data
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers['host']
        const baseUrl = `${protocol}://${host}`
        
        // Fetch internal data
        const response = await fetch(`${baseUrl}/api/bot-data`)
        const data = await response.json()
        
        res.status(200).json({
            status: 'connected',
            lastUpdate: data.stats?.lastUpdate || null,
            totalUsers: data.stats?.totalUsers || 0,
            premiumUsers: data.stats?.premiumUsers || 0,
            totalGroups: data.stats?.totalGroups || 0,
            uptime: data.system?.uptime || 0,
            nodeVersion: data.system?.nodeVersion || process.version,
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
