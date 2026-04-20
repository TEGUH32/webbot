// api/health.js
// Health check dengan informasi lengkap

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
        
        const response = await fetch(`${baseUrl}/api/bot-data`)
        const data = await response.json()
        
        res.status(200).json({
            status: 'connected',
            botName: 'Alecia Bot',
            version: '2.0.0 Premium',
            lastUpdate: data.stats?.lastUpdate || null,
            stats: {
                totalUsers: data.stats?.totalUsers || 0,
                premiumUsers: data.stats?.premiumUsers || 0,
                totalGroups: data.stats?.totalGroups || 0,
                activeUsers: data.stats?.activeUsers || 0,
                totalCommands: data.stats?.totalCommands || 0
            },
            registrations: {
                today: data.registrations?.today || 0,
                total: data.registrations?.total || 0
            },
            system: {
                uptime: data.system?.uptime || 0,
                nodeVersion: data.system?.nodeVersion || process.version,
                platform: data.system?.platform || process.platform
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
