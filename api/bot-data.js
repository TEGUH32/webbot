// api/bot-data.js
// Complete Bot Data Management - Alecia Dashboard

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
    },
    leaderboard: {
        exp: [],
        money: [],
        level: [],
        limit: []
    },
    registrations: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0,
        recent: []
    },
    activity: {
        today: [],
        recent: []
    }
}

// Helper functions
function updateLeaderboard(users) {
    if (!users || !Array.isArray(users)) return
    
    // EXP Leaderboard
    cachedData.leaderboard.exp = [...users]
        .sort((a, b) => (b.exp || 0) - (a.exp || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.exp || 0,
            isPremium: u.isPremium
        }))
    
    // Money Leaderboard
    cachedData.leaderboard.money = [...users]
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.money || 0,
            isPremium: u.isPremium
        }))
    
    // Level Leaderboard
    cachedData.leaderboard.level = [...users]
        .sort((a, b) => (b.level || 0) - (a.level || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.level || 0,
            isPremium: u.isPremium
        }))
    
    // Limit Leaderboard
    cachedData.leaderboard.limit = [...users]
        .sort((a, b) => (b.limit || 0) - (a.limit || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.limit || 0,
            isPremium: u.isPremium
        }))
}

function updateRegistrationStats(users) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const thisWeekStart = today - (now.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    
    let todayCount = 0
    let weekCount = 0
    let monthCount = 0
    let recentRegs = []
    
    for (const user of users) {
        if (user.registeredAt) {
            const regTime = new Date(user.registeredAt).getTime()
            if (regTime >= today) todayCount++
            if (regTime >= thisWeekStart) weekCount++
            if (regTime >= thisMonthStart) monthCount++
            
            if (recentRegs.length < 10) {
                recentRegs.push({
                    name: user.name,
                    number: user.number,
                    time: user.registeredAt,
                    isPremium: user.isPremium
                })
            }
        }
    }
    
    cachedData.registrations = {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        total: users.filter(u => u.registered).length,
        recent: recentRegs
    }
}

function updateActivityStats(users) {
    const now = Date.now()
    const today = new Date().toDateString()
    const recentActivity = []
    
    let todayCount = 0
    for (const user of users) {
        if (user.lastSeen) {
            const lastSeenDate = new Date(user.lastSeen).toDateString()
            if (lastSeenDate === today) {
                todayCount++
                if (recentActivity.length < 20) {
                    recentActivity.push({
                        name: user.name,
                        number: user.number,
                        time: user.lastSeen,
                        action: 'active'
                    })
                }
            }
        }
    }
    
    cachedData.activity = {
        today: todayCount,
        recent: recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time))
    }
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // ========== GET METHODS ==========
    if (req.method === 'GET') {
        const { type, limit, page, search, leaderboard } = req.query
        
        // Get specific leaderboard
        if (leaderboard && cachedData.leaderboard[leaderboard]) {
            return res.status(200).json({
                success: true,
                data: cachedData.leaderboard[leaderboard]
            })
        }
        
        // Get registrations stats
        if (type === 'registrations') {
            return res.status(200).json({
                success: true,
                data: cachedData.registrations
            })
        }
        
        // Get activity stats
        if (type === 'activity') {
            return res.status(200).json({
                success: true,
                data: cachedData.activity
            })
        }
        
        // Search users
        if (search) {
            const searchLower = search.toLowerCase()
            const filtered = cachedData.users.filter(u => 
                u.name.toLowerCase().includes(searchLower) || 
                u.number.includes(search)
            )
            return res.status(200).json({
                success: true,
                data: filtered.slice(0, 50),
                total: filtered.length
            })
        }
        
        // Get users with pagination
        if (type === 'users') {
            const pageNum = parseInt(page) || 1
            const limitNum = parseInt(limit) || 50
            const start = (pageNum - 1) * limitNum
            const end = start + limitNum
            
            return res.status(200).json({
                success: true,
                data: {
                    users: cachedData.users.slice(start, end),
                    total: cachedData.users.length,
                    page: pageNum,
                    totalPages: Math.ceil(cachedData.users.length / limitNum)
                }
            })
        }
        
        // Get premium users
        if (type === 'premium') {
            const premiumUsers = cachedData.users.filter(u => u.isPremium)
            return res.status(200).json({
                success: true,
                data: premiumUsers,
                total: premiumUsers.length
            })
        }
        
        // Get top stats
        if (type === 'top') {
            return res.status(200).json({
                success: true,
                data: {
                    topExp: cachedData.leaderboard.exp.slice(0, 10),
                    topMoney: cachedData.leaderboard.money.slice(0, 10),
                    topLevel: cachedData.leaderboard.level.slice(0, 10)
                }
            })
        }
        
        // Get single user by number
        if (type === 'user' && req.query.number) {
            const user = cachedData.users.find(u => u.number === req.query.number)
            return res.status(200).json({
                success: true,
                data: user || null
            })
        }
        
        // Get full data
        return res.status(200).json({
            success: true,
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
            leaderboard: cachedData.leaderboard,
            registrations: cachedData.registrations,
            activity: cachedData.activity,
            lastUpdate: cachedData.stats?.lastUpdate || new Date().toISOString()
        })
    }
    
    // ========== POST METHODS ==========
    if (req.method === 'POST') {
        try {
            const data = req.body
            
            // Update stats
            if (data.stats) {
                cachedData.stats = { 
                    ...cachedData.stats, 
                    ...data.stats, 
                    lastUpdate: new Date().toISOString() 
                }
            }
            
            // Update users
            if (data.users && Array.isArray(data.users)) {
                cachedData.users = data.users
                updateLeaderboard(cachedData.users)
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
            }
            
            // Update groups
            if (data.groups && Array.isArray(data.groups)) {
                cachedData.groups = data.groups
            }
            
            // Update commands
            if (data.commands && Array.isArray(data.commands)) {
                cachedData.commands = data.commands
                cachedData.stats.totalCommands = data.commands.length
            }
            
            // Update system
            if (data.system) {
                cachedData.system = {
                    ...cachedData.system,
                    ...data.system,
                    timestamp: new Date().toISOString()
                }
                cachedData.stats.uptime = data.system.uptime || cachedData.stats.uptime
            }
            
            console.log(`[BOT-DATA] Updated at ${new Date().toISOString()}`)
            console.log(`[BOT-DATA] Users: ${cachedData.stats.totalUsers}, Premium: ${cachedData.stats.premiumUsers}`)
            console.log(`[BOT-DATA] Groups: ${cachedData.stats.totalGroups}, Commands: ${cachedData.stats.totalCommands}`)
            
            return res.status(200).json({ 
                success: true, 
                message: 'Data received',
                timestamp: new Date().toISOString()
            })
        } catch (error) {
            console.error('[BOT-DATA] Error:', error)
            return res.status(500).json({ 
                success: false, 
                error: error.message 
            })
        }
    }
    
    // ========== PUT METHODS (Update single user) ==========
    if (req.method === 'PUT') {
        try {
            const { number, updates } = req.body
            
            if (!number || !updates) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Number and updates required' 
                })
            }
            
            const userIndex = cachedData.users.findIndex(u => u.number === number)
            if (userIndex !== -1) {
                cachedData.users[userIndex] = { 
                    ...cachedData.users[userIndex], 
                    ...updates 
                }
                updateLeaderboard(cachedData.users)
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'User updated',
                    user: cachedData.users[userIndex]
                })
            }
            
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            })
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                error: error.message 
            })
        }
    }
    
    // ========== DELETE METHODS ==========
    if (req.method === 'DELETE') {
        try {
            const { number } = req.query
            
            if (!number) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Number required' 
                })
            }
            
            const userIndex = cachedData.users.findIndex(u => u.number === number)
            if (userIndex !== -1) {
                cachedData.users.splice(userIndex, 1)
                updateLeaderboard(cachedData.users)
                
                return res.status(200).json({ 
                    success: true, 
                    message: 'User deleted' 
                })
            }
            
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            })
        } catch (error) {
            return res.status(500).json({ 
                success: false, 
                error: error.message 
            })
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
