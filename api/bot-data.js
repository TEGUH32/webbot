// api/bot-data.js
// Complete Bot Data Management - Alecia Dashboard Full Version

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
    },
    pendingRegistrations: []  // Untuk registrasi dari website
}

// ========== HELPER FUNCTIONS ==========

// Update all leaderboards
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
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
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
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
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
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
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
            isPremium: u.isPremium,
            isRegistered: u.isRegistered
        }))
}

// Update registration statistics
function updateRegistrationStats(users) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const thisWeekStart = today - (now.getDay() * 24 * 60 * 60 * 1000)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    
    let todayCount = 0
    let weekCount = 0
    let monthCount = 0
    let totalRegistered = 0
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
        stats: {
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount,
            total: totalRegistered
        },
        recent: recentRegs.sort((a, b) => new Date(b.time) - new Date(a.time))
    }
    
    // Also update stats.registrations
    cachedData.stats.registrations = {
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
        total: totalRegistered
    }
    cachedData.stats.registeredUsers = totalRegistered
}

// Update activity statistics
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

// Update system info
function updateSystemInfo(systemData) {
    if (systemData) {
        cachedData.system = {
            ...cachedData.system,
            ...systemData,
            timestamp: new Date().toISOString()
        }
    }
}

// ========== MAIN HANDLER ==========
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, X-Bot-Secret')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // ========== GET METHODS ==========
    if (req.method === 'GET') {
        const { type, limit, page, search, leaderboard, number } = req.query
        
        // Health check endpoint
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
        
        // Get pending registrations (for bot)
        if (type === 'pending-registrations') {
            const pending = [...cachedData.pendingRegistrations]
            // Clear after sending
            cachedData.pendingRegistrations = []
            return res.status(200).json({
                success: true,
                registrations: pending
            })
        }
        
        // Get specific leaderboard
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
        
        // Get all leaderboards
        if (type === 'all-leaderboards') {
            return res.status(200).json({
                success: true,
                data: cachedData.leaderboard,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        // Get registration stats
        if (type === 'registrations') {
            return res.status(200).json({
                success: true,
                data: cachedData.registrations,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        // Get activity stats
        if (type === 'activity') {
            return res.status(200).json({
                success: true,
                data: cachedData.activity,
                lastUpdate: cachedData.stats.lastUpdate
            })
        }
        
        // Search users
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
        
        // Get single user by number
        if (number) {
            const user = cachedData.users.find(u => u.number === number)
            return res.status(200).json({
                success: true,
                data: user || null,
                found: !!user
            })
        }
        
        // Get users with pagination
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
        
        // Get premium users
        if (type === 'premium') {
            const premiumUsers = cachedData.users.filter(u => u.isPremium === true)
            return res.status(200).json({
                success: true,
                data: premiumUsers,
                total: premiumUsers.length
            })
        }
        
        // Get registered users
        if (type === 'registered') {
            const registeredUsers = cachedData.users.filter(u => u.isRegistered === true)
            return res.status(200).json({
                success: true,
                data: registeredUsers,
                total: registeredUsers.length
            })
        }
        
        // Get groups
        if (type === 'groups') {
            return res.status(200).json({
                success: true,
                data: cachedData.groups,
                total: cachedData.groups.length
            })
        }
        
        // Get commands
        if (type === 'commands') {
            return res.status(200).json({
                success: true,
                data: cachedData.commands,
                total: cachedData.commands.length
            })
        }
        
        // Get system info
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
        
        // Get top stats
        if (type === 'top') {
            return res.status(200).json({
                success: true,
                data: {
                    topExp: cachedData.leaderboard.exp.slice(0, 10),
                    topMoney: cachedData.leaderboard.money.slice(0, 10),
                    topLevel: cachedData.leaderboard.level.slice(0, 10),
                    topLimit: cachedData.leaderboard.limit.slice(0, 10)
                }
            })
        }
        
        // ========== FULL DATA RESPONSE ==========
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
                cachedData.stats.totalGroups = data.groups.length
            }
            
            // Update commands
            if (data.commands && Array.isArray(data.commands)) {
                cachedData.commands = data.commands
                cachedData.stats.totalCommands = data.commands.length
            }
            
            // Update system
            if (data.system) {
                updateSystemInfo(data.system)
                cachedData.stats.uptime = data.system.uptime || cachedData.stats.uptime
            }
            
            // Handle new registration from website
            if (data.type === 'register' && data.number && data.name) {
                const newRegistration = {
                    number: data.number,
                    name: data.name,
                    age: data.age || 0,
                    registeredAt: new Date().toISOString(),
                    status: 'pending'
                }
                cachedData.pendingRegistrations.push(newRegistration)
                console.log(`📝 New pending registration: ${data.name} (${data.number})`)
            }
            
            console.log(`[BOT-DATA] Updated at ${new Date().toISOString()}`)
            console.log(`📊 Users: ${cachedData.stats.totalUsers}, Premium: ${cachedData.stats.premiumUsers}`)
            console.log(`👥 Groups: ${cachedData.stats.totalGroups}, Commands: ${cachedData.stats.totalCommands}`)
            console.log(`📝 Registered: ${cachedData.stats.registeredUsers}, Pending: ${cachedData.pendingRegistrations.length}`)
            
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
    
    // ========== PUT METHODS ==========
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
                    ...updates,
                    lastUpdated: new Date().toISOString()
                }
                updateLeaderboard(cachedData.users)
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
                
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
                updateRegistrationStats(cachedData.users)
                updateActivityStats(cachedData.users)
                
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
