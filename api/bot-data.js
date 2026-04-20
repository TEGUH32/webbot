// api/bot-data.js
// Menerima data dari bot dan menyediakan untuk frontend

let cachedData = {
    stats: {
        totalUsers: 0,
        premiumUsers: 0,
        totalGroups: 0,
        activeUsers: 0,
        totalCommands: 0,
        totalMoney: 0,
        totalExp: 0,
        uptime: 0,
        lastUpdate: null
    },
    users: [],
    groups: [],
    commands: [],
    system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpuCores: 0,
        memoryUsage: {
            rss: 0,
            heapTotal: 0,
            heapUsed: 0,
            external: 0
        },
        uptime: 0,
        timestamp: null
    }
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // GET - ambil data untuk frontend
    if (req.method === 'GET') {
        // Kirim data termasuk system info
        return res.status(200).json({
            stats: cachedData.stats,
            users: cachedData.users,
            groups: cachedData.groups,
            commands: cachedData.commands,
            system: {
                nodeVersion: cachedData.system?.nodeVersion || process.version,
                platform: cachedData.system?.platform || process.platform,
                arch: cachedData.system?.arch || process.arch,
                cpuCores: cachedData.system?.cpuCores || 1,
                memoryUsage: cachedData.system?.memoryUsage || {
                    rss: process.memoryUsage().rss,
                    heapTotal: process.memoryUsage().heapTotal,
                    heapUsed: process.memoryUsage().heapUsed,
                    external: process.memoryUsage().external
                },
                uptime: cachedData.system?.uptime || process.uptime(),
                timestamp: new Date().toISOString()
            },
            lastUpdate: cachedData.stats?.lastUpdate || new Date().toISOString()
        })
    }
    
    // POST - terima data dari bot
    if (req.method === 'POST') {
        try {
            const data = req.body
            
            // Update semua data
            if (data.stats) cachedData.stats = { ...cachedData.stats, ...data.stats, lastUpdate: new Date().toISOString() }
            if (data.users) cachedData.users = data.users
            if (data.groups) cachedData.groups = data.groups
            if (data.commands) cachedData.commands = data.commands
            if (data.system) {
                cachedData.system = {
                    ...cachedData.system,
                    ...data.system,
                    timestamp: new Date().toISOString()
                }
            }
            
            console.log(`✅ Data received at ${new Date().toISOString()}`)
            console.log(`📊 Users: ${cachedData.stats.totalUsers}, Groups: ${cachedData.stats.totalGroups}`)
            
            return res.status(200).json({ 
                success: true, 
                message: 'Data received',
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error processing data:', error)
            return res.status(500).json({ success: false, error: error.message })
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
