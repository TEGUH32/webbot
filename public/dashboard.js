// public/dashboard.js
// Alecia Dashboard - Complete Version with All Features

// ========== GLOBAL VARIABLES ==========
let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allData = {
    stats: {},
    users: [],
    groups: [],
    commands: [],
    system: {},
    leaderboard: {},
    registrations: {},
    activity: {}
}
let currentLeaderboard = 'exp'
let refreshInterval = null
let notificationSound = null
let lastUpdateTime = null

// ========== POPULAR COMMANDS LIST ==========
const popularCommands = [
    { name: 'menu', description: 'Menampilkan semua fitur bot', category: 'main' },
    { name: 'profile', description: 'Melihat profil user', category: 'main' },
    { name: 'daily', description: 'Ambil limit harian', category: 'rpg' },
    { name: 'claim', description: 'Claim bonus', category: 'rpg' },
    { name: 'transfer', description: 'Transfer money ke user lain', category: 'economy' },
    { name: 'shop', description: 'Melihat item shop', category: 'shop' },
    { name: 'buy', description: 'Membeli item', category: 'shop' },
    { name: 'inventory', description: 'Melihat inventory', category: 'rpg' },
    { name: 'level', description: 'Cek level user', category: 'main' },
    { name: 'leaderboard', description: 'Melihat leaderboard', category: 'main' },
    { name: 'premium', description: 'Info premium', category: 'premium' },
    { name: 'register', description: 'Registrasi user', category: 'main' },
    { name: 'work', description: 'Bekerja untuk mendapatkan money', category: 'economy' },
    { name: 'mine', description: 'Menambang', category: 'rpg' },
    { name: 'hunt', description: 'Berburu hewan', category: 'rpg' },
    { name: 'fish', description: 'Memancing', category: 'rpg' },
    { name: 'adventure', description: 'Petualangan', category: 'rpg' },
    { name: 'duel', description: 'Duel dengan user lain', category: 'game' },
    { name: 'casino', description: 'Main judi', category: 'game' },
    { name: 'gift', description: 'Kirim gift ke user', category: 'economy' }
]

// ========== SAFE ELEMENT GETTER ==========
function getElement(id) {
    const el = document.getElementById(id)
    if (!el) console.warn(`Element ${id} not found`)
    return el
}

function setInnerHTML(id, html) {
    const el = getElement(id)
    if (el) el.innerHTML = html
}

// ========== NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'info') {
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    }
    
    const toast = document.createElement('div')
    toast.className = 'position-fixed bottom-0 end-0 m-3 p-3 rounded-3 animate__animated animate__fadeInUp'
    toast.style.background = '#1a1a2e'
    toast.style.borderLeft = `4px solid ${colors[type]}`
    toast.style.borderRadius = '12px'
    toast.style.boxShadow = '0 5px 20px rgba(0,0,0,0.3)'
    toast.style.zIndex = '9999'
    toast.style.minWidth = '280px'
    toast.style.maxWidth = '350px'
    toast.style.backdropFilter = 'blur(10px)'
    toast.innerHTML = `
        <div class="d-flex align-items-center gap-3">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : type === 'error' ? 'exclamation-triangle-fill' : type === 'warning' ? 'exclamation-triangle-fill' : 'info-circle-fill'} fs-4" style="color: ${colors[type]}"></i>
            <div class="flex-grow-1">
                <small class="text-white-50">${new Date().toLocaleTimeString()}</small>
                <div class="text-white">${message}</div>
            </div>
            <button class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5000)
}

// ========== LOAD ALL DATA ==========
async function loadAllData() {
    try {
        const response = await fetch('/api/bot-data')
        const data = await response.json()
        
        console.log('Full data received:', data)
        
        if (data) {
            allData = data
            
            // Update stats
            if (data.stats) updateStats(data.stats)
            
            // Update users
            if (data.users && Array.isArray(data.users)) {
                updateUsersTable(data.users)
                const userCount = getElement('userCount')
                if (userCount) userCount.innerHTML = `<i class="bi bi-database"></i> Total: ${data.users.length} users`
            }
            
            // Update groups
            if (data.groups && Array.isArray(data.groups)) updateGroupsTable(data.groups)
            
            // Update commands
            if (data.commands && Array.isArray(data.commands)) {
                updateCommandsTable(data.commands)
                const cmdCount = getElement('commandCount')
                if (cmdCount) cmdCount.innerHTML = `<i class="bi bi-terminal"></i> Total: ${data.commands.length} commands`
                updatePopularCommands()
            }
            
            // Update system info
            if (data.system) {
                updateSystemInfo(data.system)
            }
            
            // Update leaderboard
            if (data.leaderboard) {
                updateLeaderboardFromData(data.leaderboard)
            } else if (data.users && data.users.length > 0) {
                loadLeaderboard(currentLeaderboard)
            }
            
            // Update registrations
            if (data.registrations) {
                updateRegistrationStats(data.registrations)
            }
            
            // Update activity
            if (data.activity) {
                updateActivityStats(data.activity)
            }
            
            // Update status
            const botStatus = getElement('botStatus')
            if (botStatus) {
                botStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i> Online'
                botStatus.className = 'status-online'
            }
            
            const lastUpdate = getElement('lastUpdate')
            if (lastUpdate && data.stats?.lastUpdate) {
                lastUpdate.innerHTML = new Date(data.stats.lastUpdate).toLocaleString()
                lastUpdateTime = data.stats.lastUpdate
            }
            
            // Show notification for new data
            if (lastUpdateTime && data.stats?.lastUpdate > lastUpdateTime) {
                showNotification('Data dashboard telah diperbarui!', 'success')
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
        const botStatus = getElement('botStatus')
        if (botStatus) {
            botStatus.innerHTML = '<i class="bi bi-x-circle-fill"></i> Offline'
            botStatus.className = 'status-offline'
        }
        showNotification('Gagal terhubung ke bot!', 'error')
    }
}

// ========== UPDATE STATS CARDS ==========
function updateStats(stats) {
    const elements = {
        totalUsers: stats.totalUsers || 0,
        premiumUsers: stats.premiumUsers || 0,
        registeredUsers: stats.registeredUsers || 0,
        totalGroups: stats.totalGroups || 0,
        totalCommands: stats.totalCommands || 0,
        activeUsers: stats.activeUsers || 0,
        totalMoney: stats.totalMoney || 0,
        totalExp: stats.totalExp || 0
    }
    
    for (const [id, value] of Object.entries(elements)) {
        const elem = getElement(id)
        if (elem) elem.innerHTML = value.toLocaleString()
    }
    
    // Update uptime
    if (stats.uptime) {
        const uptimeElem = getElement('uptime')
        if (uptimeElem) {
            const days = Math.floor(stats.uptime / 86400)
            const hours = Math.floor((stats.uptime % 86400) / 3600)
            const minutes = Math.floor((stats.uptime % 3600) / 60)
            uptimeElem.innerHTML = `${days}d ${hours}h ${minutes}m`
        }
    }
}

// ========== UPDATE SYSTEM INFO ==========
function updateSystemInfo(system) {
    console.log('Updating system info:', system)
    
    if (!system) return
    
    const nodeVersion = getElement('nodeVersion')
    if (nodeVersion) nodeVersion.innerHTML = system.nodeVersion || '-'
    
    const platform = getElement('platform')
    if (platform) platform.innerHTML = system.platform || '-'
    
    const arch = getElement('arch')
    if (arch) arch.innerHTML = system.arch || '-'
    
    const cpuCores = getElement('cpuCores')
    if (cpuCores) cpuCores.innerHTML = system.cpuCores || '-'
    
    const systemUptime = getElement('systemUptime')
    if (systemUptime && system.uptime) {
        const days = Math.floor(system.uptime / 86400)
        const hours = Math.floor((system.uptime % 86400) / 3600)
        const minutes = Math.floor((system.uptime % 3600) / 60)
        systemUptime.innerHTML = `${days}d ${hours}h ${minutes}m`
    }
    
    // Memory Usage
    if (system.memoryUsage) {
        const memoryRSS = getElement('memoryRSS')
        if (memoryRSS) memoryRSS.innerHTML = formatBytes(system.memoryUsage.rss || 0)
        
        const heapTotal = getElement('heapTotal')
        if (heapTotal) heapTotal.innerHTML = formatBytes(system.memoryUsage.heapTotal || 0)
        
        const heapUsed = getElement('heapUsed')
        if (heapUsed) heapUsed.innerHTML = formatBytes(system.memoryUsage.heapUsed || 0)
        
        const external = getElement('external')
        if (external) external.innerHTML = formatBytes(system.memoryUsage.external || 0)
        
        const memoryStatus = getElement('memoryStatus')
        if (memoryStatus && system.memoryUsage.heapTotal && system.memoryUsage.heapUsed) {
            const percent = (system.memoryUsage.heapUsed / system.memoryUsage.heapTotal) * 100
            if (percent > 80) {
                memoryStatus.innerHTML = '⚠️ High Usage'
                memoryStatus.className = 'text-warning'
            } else if (percent > 50) {
                memoryStatus.innerHTML = '🟡 Moderate'
                memoryStatus.className = 'text-warning'
            } else {
                memoryStatus.innerHTML = '✅ Normal'
                memoryStatus.className = 'text-success'
            }
        }
    }
}

// ========== UPDATE REGISTRATION STATS ==========
function updateRegistrationStats(registrations) {
    if (!registrations) return
    
    const regToday = getElement('regToday')
    if (regToday) regToday.innerHTML = registrations.stats?.today || 0
    
    const regWeek = getElement('regWeek')
    if (regWeek) regWeek.innerHTML = registrations.stats?.thisWeek || 0
    
    const regMonth = getElement('regMonth')
    if (regMonth) regMonth.innerHTML = registrations.stats?.thisMonth || 0
    
    const regTotal = getElement('regTotal')
    if (regTotal) regTotal.innerHTML = registrations.stats?.total || 0
    
    // Update recent registrations
    const recentRegs = getElement('recentRegistrations')
    if (recentRegs && registrations.recent) {
        recentRegs.innerHTML = registrations.recent.slice(0, 5).map(reg => `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary">
                <div>
                    <i class="bi bi-person-plus-fill text-success"></i>
                    <strong>${escapeHtml(reg.name)}</strong>
                    <small class="text-white-50 d-block">${reg.number}</small>
                </div>
                <small class="text-white-50">${new Date(reg.time).toLocaleString()}</small>
            </div>
        `).join('')
        if (registrations.recent.length === 0) {
            recentRegs.innerHTML = '<div class="text-center text-white-50 py-3">Belum ada registrasi</div>'
        }
    }
}

// ========== UPDATE ACTIVITY STATS ==========
function updateActivityStats(activity) {
    if (!activity) return
    
    const activeToday = getElement('activeToday')
    if (activeToday) activeToday.innerHTML = activity.today || 0
    
    const recentActivity = getElement('recentActivity')
    if (recentActivity && activity.recent) {
        recentActivity.innerHTML = activity.recent.slice(0, 5).map(act => `
            <div class="d-flex justify-content-between align-items-center p-2 border-bottom border-secondary">
                <div>
                    <i class="bi bi-person-walking text-info"></i>
                    <strong>${escapeHtml(act.name)}</strong>
                    <small class="text-white-50 d-block">${act.number}</small>
                </div>
                <small class="text-white-50">${new Date(act.time).toLocaleString()}</small>
            </div>
        `).join('')
        if (activity.recent.length === 0) {
            recentActivity.innerHTML = '<div class="text-center text-white-50 py-3">Belum ada aktivitas</div>'
        }
    }
}

// ========== UPDATE POPULAR COMMANDS ==========
function updatePopularCommands() {
    const container = getElement('popularCommandsList')
    if (!container) return
    
    container.innerHTML = popularCommands.map(cmd => `
        <div class="col-md-6 mb-2">
            <div class="d-flex align-items-center p-2 rounded" style="background: rgba(255,255,255,0.05);">
                <code class="me-2" style="background: rgba(255,215,0,0.2); padding: 4px 8px; border-radius: 8px;">.${cmd.name}</code>
                <small class="text-white-50">${cmd.description}</small>
                <span class="badge bg-secondary ms-auto">${cmd.category}</span>
            </div>
        </div>
    `).join('')
}

// ========== LEADERBOARD FUNCTIONS ==========
function updateLeaderboardFromData(leaderboard) {
    if (!leaderboard) return
    
    const expData = leaderboard.exp || []
    const moneyData = leaderboard.money || []
    const levelData = leaderboard.level || []
    const limitData = leaderboard.limit || []
    
    // Update top 3
    if (expData.length > 0) {
        const firstName = getElement('firstName')
        const firstValue = getElement('firstValue')
        const secondName = getElement('secondName')
        const secondValue = getElement('secondValue')
        const thirdName = getElement('thirdName')
        const thirdValue = getElement('thirdValue')
        
        if (firstName && expData[0]) firstName.innerHTML = expData[0].name
        if (firstValue && expData[0]) firstValue.innerHTML = `EXP: ${expData[0].value.toLocaleString()}`
        if (secondName && expData[1]) secondName.innerHTML = expData[1].name
        if (secondValue && expData[1]) secondValue.innerHTML = `EXP: ${expData[1].value.toLocaleString()}`
        if (thirdName && expData[2]) thirdName.innerHTML = expData[2].name
        if (thirdValue && expData[2]) thirdValue.innerHTML = `EXP: ${expData[2].value.toLocaleString()}`
    }
    
    // Update current leaderboard
    loadLeaderboard(currentLeaderboard)
}

function loadLeaderboard(type) {
    currentLeaderboard = type
    let data = []
    
    switch(type) {
        case 'exp':
            data = allData.leaderboard?.exp || []
            break
        case 'money':
            data = allData.leaderboard?.money || []
            break
        case 'level':
            data = allData.leaderboard?.level || []
            break
        case 'limit':
            data = allData.leaderboard?.limit || []
            break
        default:
            data = allData.leaderboard?.exp || []
    }
    
    const tbody = getElement('leaderboardList')
    if (!tbody) return
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>'
        return
    }
    
    tbody.innerHTML = data.slice(0, 50).map(user => `
        <tr>
            <td><strong>${user.rank}</strong> ${getRankIcon(user.rank)}</td>
            <td><i class="bi bi-person-circle"></i> ${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.number)}</td>
            <td><strong>${user.value.toLocaleString()}</strong></td>
            <td>${user.isPremium ? '<span class="badge bg-warning text-dark">Premium</span>' : '<span class="badge bg-secondary">Free</span>'}</td>
        </tr>
    `).join('')
}

function getRankIcon(rank) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return ''
}

// ========== USERS TABLE ==========
function updateUsersTable(users) {
    const tbody = getElement('usersList')
    if (!tbody) return
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>'
        return
    }
    
    const start = (currentPage - 1) * currentLimit
    const paginated = users.slice(start, start + currentLimit)
    
    tbody.innerHTML = paginated.map(user => `
        <tr>
            <td><i class="bi bi-person-circle"></i> ${escapeHtml(user.name || user.number)}</td>
            <td>${escapeHtml(user.number)}</td>
            <td>${user.isPremium ? '<span class="badge bg-warning text-dark">Premium</span>' : '<span class="badge bg-secondary">Free</span>'}</td>
            <td>Level ${user.level || 0}</td>
            <td>💰 ${(user.money || 0).toLocaleString()}</td>
            <td>🎫 ${(user.limit || 0).toLocaleString()}</td>
        </tr>
    `).join('')
    
    totalPages = Math.ceil(users.length / currentLimit)
    updatePagination()
}

// ========== GROUPS TABLE ==========
function updateGroupsTable(groups) {
    const tbody = getElement('groupsList')
    if (!tbody) return
    
    if (!groups || groups.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No groups found</td></tr>'
        return
    }
    
    tbody.innerHTML = groups.map(group => `
        <tr>
            <td><i class="bi bi-chat-dots"></i> ${escapeHtml(group.name)}</td>
            <td><small>${escapeHtml(group.id)}</small></td>
            <td>${group.members || 0}</td>
            <td>${group.isBanned ? '<span class="badge bg-danger">Banned</span>' : '<span class="badge bg-success">Active</span>'}</td>
        </tr>
    `).join('')
}

// ========== COMMANDS TABLE ==========
function updateCommandsTable(commands) {
    const tbody = getElement('commandsList')
    if (!tbody) return
    
    const categorySelect = getElement('commandCategory')
    const category = categorySelect ? categorySelect.value : 'all'
    const filtered = category === 'all' ? commands : commands.filter(c => c.category === category)
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
        return
    }
    
    tbody.innerHTML = filtered.map(cmd => `
        <tr>
            <td><code>${escapeHtml(cmd.name)}</code></td>
            <td><span class="badge bg-secondary">${escapeHtml(cmd.category)}</span></td>
            <td>${cmd.isPremium ? '<span class="badge bg-warning text-dark">Premium</span>' : '<span class="badge bg-info">Free</span>'}</td>
            <td><small>${escapeHtml(cmd.description || '-')}</small></td>
        </tr>
    `).join('')
}

// ========== PAGINATION ==========
function updatePagination() {
    const pagination = getElement('pagination')
    if (!pagination) return
    
    pagination.innerHTML = ''
    if (totalPages <= 1) return
    
    pagination.innerHTML += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button></li>`
    
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, currentPage + 2)
    
    for (let i = start; i <= end; i++) {
        pagination.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <button class="page-link" onclick="changePage(${i})">${i}</button></li>`
    }
    
    pagination.innerHTML += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button></li>`
}

function changePage(page) {
    if (page < 1 || page > totalPages) return
    currentPage = page
    if (allData.users) updateUsersTable(allData.users)
}

// ========== REFRESH DATA ==========
async function refreshData() {
    showNotification('Memperbarui data...', 'info')
    setInnerHTML('usersList', '<tr><td colspan="6" class="text-center"><div class="spinner-border text-warning"></div> Loading...</td></tr>')
    await loadAllData()
    const refreshTime = getElement('refreshTime')
    if (refreshTime) refreshTime.innerHTML = new Date().toLocaleTimeString()
    showNotification('Data berhasil diperbarui!', 'success')
}

// ========== TEST CONNECTION ==========
async function testConnection() {
    showNotification('Mengecek koneksi ke bot...', 'info')
    
    try {
        const response = await fetch('/api/health')
        const data = await response.json()
        
        if (data.status === 'connected') {
            showNotification(`✅ Terhubung ke bot! Last update: ${new Date(data.lastUpdate).toLocaleString()}`, 'success')
        } else {
            showNotification('⚠️ Menunggu data dari bot...', 'warning')
        }
    } catch (error) {
        showNotification(`❌ Gagal terhubung: ${error.message}`, 'error')
    }
}

// ========== UTILITY FUNCTIONS ==========
function formatBytes(bytes) {
    if (bytes === 0 || !bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;')
}

function updateLiveTime() {
    const liveTime = getElement('liveTime')
    if (liveTime) {
        liveTime.innerHTML = new Date().toLocaleString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
    }
}

// ========== EXPORT FUNCTIONS TO GLOBAL ==========
window.changePage = changePage
window.refreshData = refreshData
window.testConnection = testConnection
window.loadLeaderboard = loadLeaderboard
window.goToPage = changePage

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', () => {
    // User limit change
    const userLimit = getElement('userLimit')
    if (userLimit) {
        userLimit.addEventListener('change', (e) => {
            currentLimit = parseInt(e.target.value)
            currentPage = 1
            if (allData.users) updateUsersTable(allData.users)
        })
    }
    
    // Command category filter
    const commandCategory = getElement('commandCategory')
    if (commandCategory) {
        commandCategory.addEventListener('change', () => {
            if (allData.commands) updateCommandsTable(allData.commands)
        })
    }
    
    // Search user
    const searchUser = getElement('searchUser')
    if (searchUser) {
        let timeout
        searchUser.addEventListener('input', (e) => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                const search = e.target.value.toLowerCase()
                if (!allData.users) return
                if (search.length < 2) {
                    updateUsersTable(allData.users)
                    return
                }
                const filtered = allData.users.filter(u => 
                    (u.name || '').toLowerCase().includes(search) || 
                    (u.number || '').includes(search)
                )
                updateUsersTable(filtered)
            }, 500)
        })
    }
    
    // Leaderboard buttons
    const lbExp = getElement('lbExp')
    if (lbExp) lbExp.onclick = () => loadLeaderboard('exp')
    
    const lbMoney = getElement('lbMoney')
    if (lbMoney) lbMoney.onclick = () => loadLeaderboard('money')
    
    const lbLevel = getElement('lbLevel')
    if (lbLevel) lbLevel.onclick = () => loadLeaderboard('level')
    
    const lbLimit = getElement('lbLimit')
    if (lbLimit) lbLimit.onclick = () => loadLeaderboard('limit')
})

// ========== AUTO REFRESH ==========
// Auto refresh every 30 seconds
setInterval(() => loadAllData(), 30000)

// Update live time every second
setInterval(updateLiveTime, 1000)

// Initial load
updateLiveTime()
loadAllData()
showNotification('Dashboard siap! Data akan otomatis refresh setiap 30 detik.', 'success')
