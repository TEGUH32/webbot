// api/bot-data.js
// Complete Bot Data Management - Alecia Dashboard

let cachedData = {
    stats: {
        totalUsers: 0,
        premiumUsers: 0,
        registeredUsers: 0,
        totalGroups: 0,
        activeUsers: 0,
        totalCommands: 0,
        totalMoney: 0,
        totalExp: 0,
        uptime: 0,
        lastUpdate: null,
        registrations: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            total: 0
        }
    },
    users: [],
    groups: [],
    commands: [],
    system: {
        botName: 'Alecia Bot',
        version: '2.0.0 Premium',
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
        stats: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            total: 0
        },
        recent: []
    },
    activity: {
        today: 0,
        recent: []
    }
}

// Helper functions
function updateLeaderboard(users) {
    if (!users || !Array.isArray(users)) return
    
    cachedData.leaderboard.exp = [...users]
        .sort((a, b) => (b.exp || 0) - (a.exp || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.exp || 0,
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
        }))
    
    cachedData.leaderboard.money = [...users]
        .sort((a, b) => (b.money || 0) - (a.money || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.money || 0,
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
        }))
    
    cachedData.leaderboard.level = [...users]
        .sort((a, b) => (b.level || 0) - (a.level || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.level || 0,
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
        }))
    
    cachedData.leaderboard.limit = [...users]
        .sort((a, b) => (b.limit || 0) - (a.limit || 0))
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            name: u.name,
            number: u.number,
            value: u.limit || 0,
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
        }))
}

function updateRegistrationStats(users) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const thisWeekStart = today - (now.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    
    let todayCount = 0, weekCount = 0, monthCount = 0, totalRegistered = 0
    let recentRegs = []
    
    for (const user of users) {
        if (user.isRegistered === true) {
            totalRegistered++
            if (user.registeredAt) {
                const regTime = new Date(user.registeredAt).getTime()
                if (regTime >= today) todayCount++
                if (regTime >= thisWeekStart) weekCount++
                if (regTime >= thisMonthStart) monthCount++
                if (recentRegs.length < 20) {
                    recentRegs.push({
                        name: user.name,
                        number: user.number,
                        time: user.registeredAt,
                        isPremium: user.isPremium,
                        level: user.level || 0
                    })
                }
            }
        }
    }
    
    cachedData.registrations = {
        stats: { today: todayCount, thisWeek: weekCount, thisMonth: monthCount, total: totalRegistered },
        recent: recentRegs.sort((a, b) => new Date(b.time) - new Date(a.time))
    }
    cachedData.stats.registrations = { today: todayCount, thisWeek: weekCount, thisMonth: monthCount, total: totalRegistered }
    cachedData.stats.registeredUsers = totalRegistered
}

function updateActivityStats(users) {
    const now = Date.now()
    const today = new Date().toDateString()
    const recentActivity = []
    let activeToday = 0
    
    for (const user of users) {
        if (user.lastSeen) {
            const lastSeenDate = new Date(user.lastSeen).toDateString()
            if (lastSeenDate === today) {
                activeToday++
                if (recentActivity.length < 30) {
                    recentActivity.push({
                        name: user.name,
                        number: user.number,
                        time: user.lastSeen,
                        action: 'active',
                        level: user.level || 0
                    })
                }
            }
        }
    }
    
    cachedData.activity = {
        today: activeToday,
        recent: recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time))
    }
    cachedData.stats.activeUsers = activeToday
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // ========== GET METHODS ==========
    if (req.method === 'GET') {
        const { type, limit, page, search, leaderboard, number } = req.query
        
        if (type === 'health') {
            return res.status(200).json({
                status: 'ok',
                botName: 'Alecia Bot',
                version: '2.0.0 Premium',
                lastUpdate: cachedData.stats.lastUpdate,
                totalUsers: cachedData.stats.totalUsers,
                timestamp: new Date().toISOString()
            })
        }
        
        if (leaderboard && cachedData.leaderboard[leaderboard]) {
            const limitNum = parseInt(limit) || 20
            return res.status(200).json({
                success: true,
                type: leaderboard,
                data: cachedData.leaderboard[leaderboard].slice(0, limitNum),
                total: cachedData.leaderboard[leaderboard].length,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        if (type === 'registrations') {
            return res.status(200).json({
                success: true,
                data: cachedData.registrations,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        if (type === 'activity') {
            return res.status(200).json({
                success: true,
                data: cachedData.activity,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        if (search && search.length > 0) {
            const searchLower = search.toLowerCase()
            const filtered = cachedData.users.filter(u => 
                (u.name || '').toLowerCase().includes(searchLower) || 
                (u.number || '').includes(search)
            )
            return res.status(200).json({
                success: true,
                data: filtered.slice(0, 100),
                total: filtered.length,
                search: search
            })
        }
        
        if (number) {
            const user = cachedData.users.find(u => u.number === number)
            return res.status(200).json({
                success: true,
                data: user || null,
                found: !!user
            })
        }
        
        if (type === 'users') {
            const pageNum = parseInt(page) || 1
            const limitNum = parseInt(limit) || 50
            const start = (pageNum - 1) * limitNum
            const end = start + limitNum
            const paginatedUsers = cachedData.users.slice(start, end)
            
            return res.status(200).json({
                success: true,
                data: {
                    users: paginatedUsers,
                    total: cachedData.users.length,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(cachedData.users.length / limitNum)
                }
            })
        }
        
        if (type === 'premium') {
            const premiumUsers = cachedData.users.filter(u => u.isPremium === true)
            return res.status(200).json({
                success: true,
                data: premiumUsers,
                total: premiumUsers.length
            })
        }
        
        if (type === 'groups') {
            return res.status(200).json({
                success: true,
                data: cachedData.groups,
                total: cachedData.groups.length
            })
        }
        
        if (type === 'commands') {
            return res.status(200).json({
                success: true,
                data: cachedData.commands,
                total: cachedData.commands.length
            })
        }
        
        if (type === 'system') {
            return res.status(200).json({
                success: true,
                data: cachedData.system,
                botInfo: {
                    name: 'Alecia Bot',
                    version: '2.0.0 Premium',
                    owner: 'Teguh'
                }
            })
        }
        
        // Full data response
        return res.status(200).json({
            success: true,
            stats: cachedData.stats,
            users: cachedData.users,
            groups: cachedData.groups,
            commands: cachedData.commands,
            system: cachedData.system,
            leaderboard: cachedData.leaderboard,
            registrations: cachedData.registrations,
            activity: cachedData.activity,
            lastUpdate: cachedData.stats.lastUpdate,
            serverTime: new Date().toISOString()
        })
    }
    
    // ========== POST METHODS ==========
    if (req.method === 'POST') {
        try {
            const data = req.body
            
            if (data.stats) {
                cachedData.stats = { ...cachedData.stats, ...data.stats, lastUpdate: new Date().toISOString() }
            }
            
            if (data.users && Array.isArray(data.users)) {
                cachedData.users = data.users
                updateLeaderboard(cachedData.users)
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
            }
            
            if (data.groups && Array.isArray(data.groups)) {
                cachedData.groups = data.groups
                cachedData.stats.totalGroups = data.groups.length
            }
            
            if (data.commands && Array.isArray(data.commands)) {
                cachedData.commands = data.commands
                cachedData.stats.totalCommands = data.commands.length
            }
            
            if (data.system) {
                cachedData.system = { ...cachedData.system, ...data.system, timestamp: new Date().toISOString() }
                cachedData.stats.uptime = data.system.uptime || cachedData.stats.uptime
            }
            
            console.log(`[BOT-DATA] Updated at ${new Date().toISOString()}`)
            console.log(`Users: ${cachedData.stats.totalUsers}, Premium: ${cachedData.stats.premiumUsers}`)
            console.log(`Groups: ${cachedData.stats.totalGroups}, Commands: ${cachedData.stats.totalCommands}`)
            
            return res.status(200).json({ success: true, message: 'Data received', timestamp: new Date().toISOString() })
        } catch (error) {
            console.error('[BOT-DATA] Error:', error)
            return res.status(500).json({ success: false, error: error.message })
        }
    }
    
    // ========== PUT METHODS ==========
    if (req.method === 'PUT') {
        try {
            const { number, updates } = req.body
            if (!number || !updates) {
                return res.status(400).json({ success: false, error: 'Number and updates required' })
            }
            
            const userIndex = cachedData.users.findIndex(u => u.number === number)
            if (userIndex !== -1) {
                cachedData.users[userIndex] = { ...cachedData.users[userIndex], ...updates, lastUpdated: new Date().toISOString() }
                updateLeaderboard(cachedData.users)
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
                
                return res.status(200).json({ success: true, message: 'User updated', user: cachedData.users[userIndex] })
            }
            
            return res.status(404).json({ success: false, error: 'User not found' })
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }
    
    // ========== DELETE METHODS ==========
    if (req.method === 'DELETE') {
        try {
            const { number } = req.query
            if (!number) {
                return res.status(400).json({ success: false, error: 'Number required' })
            }
            
            const userIndex = cachedData.users.findIndex(u => u.number === number)
            if (userIndex !== -1) {
                cachedData.users.splice(userIndex, 1)
                updateLeaderboard(cachedData.users)
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
                
                return res.status(200).json({ success: true, message: 'User deleted' })
            }
            
            return res.status(404).json({ success: false, error: 'User not found' })
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
