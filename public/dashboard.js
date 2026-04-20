// public/dashboard.js
// Alecia Dashboard - Complete with Leaderboard

let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allData = {
    stats: {},
    users: [],
    groups: [],
    commands: []
}
let currentLeaderboard = 'exp'

// Safe element getter
function getElement(id) {
    const el = document.getElementById(id)
    if (!el) console.warn(`Element ${id} not found`)
    return el
}

function setInnerHTML(id, html) {
    const el = getElement(id)
    if (el) el.innerHTML = html
}

// Load all data
async function loadAllData() {
    try {
        const response = await fetch('/api/bot-data')
        const data = await response.json()
        
        console.log('Data received:', data)
        
        if (data) {
            allData = data
            
            if (data.stats) updateStats(data.stats)
            if (data.users && Array.isArray(data.users)) {
                updateUsersTable(data.users)
                const userCount = getElement('userCount')
                if (userCount) userCount.innerHTML = `<i class="bi bi-database"></i> Total: ${data.users.length} users`
            }
            if (data.groups && Array.isArray(data.groups)) updateGroupsTable(data.groups)
            if (data.commands && Array.isArray(data.commands)) {
                updateCommandsTable(data.commands)
                const cmdCount = getElement('commandCount')
                if (cmdCount) cmdCount.innerHTML = `<i class="bi bi-terminal"></i> Total: ${data.commands.length} commands`
            }
            if (data.system) updateSystemInfo(data.system)
            
            // Load leaderboard with user data
            if (data.users && data.users.length > 0) {
                loadLeaderboard(currentLeaderboard)
            }
            
            const botStatus = getElement('botStatus')
            if (botStatus) {
                botStatus.innerHTML = 'Online ✅'
                botStatus.className = 'status-online'
            }
            
            const lastUpdate = getElement('lastUpdate')
            if (lastUpdate && data.stats?.lastUpdate) {
                lastUpdate.innerHTML = new Date(data.stats.lastUpdate).toLocaleString()
            }
        }
    } catch (error) {
        console.error('Error:', error)
        const botStatus = getElement('botStatus')
        if (botStatus) {
            botStatus.innerHTML = 'Error ❌'
            botStatus.className = 'status-offline'
        }
    }
}

// Update stats
function updateStats(stats) {
    const elements = ['totalUsers', 'premiumUsers', 'totalGroups', 'totalCommands', 'activeUsers']
    elements.forEach(el => {
        const elem = getElement(el)
        if (elem) elem.innerHTML = (stats[el] || 0).toLocaleString()
    })
    
    const uptime = getElement('uptime')
    if (uptime && stats.uptime) {
        const days = Math.floor(stats.uptime / 86400)
        const hours = Math.floor((stats.uptime % 86400) / 3600)
        const minutes = Math.floor((stats.uptime % 3600) / 60)
        uptime.innerHTML = `${days}d ${hours}h ${minutes}m`
    }
}

// Load Leaderboard
function loadLeaderboard(type) {
    currentLeaderboard = type
    if (!allData.users || allData.users.length === 0) return
    
    let sorted = [...allData.users]
    let title = ''
    
    switch(type) {
        case 'exp':
            sorted.sort((a, b) => (b.exp || 0) - (a.exp || 0))
            title = '🏆 EXP Leaderboard'
            break
        case 'money':
            sorted.sort((a, b) => (b.money || 0) - (a.money || 0))
            title = '💰 Money Leaderboard'
            break
        case 'level':
            sorted.sort((a, b) => (b.level || 0) - (a.level || 0))
            title = '⭐ Level Leaderboard'
            break
        case 'limit':
            sorted.sort((a, b) => (b.limit || 0) - (a.limit || 0))
            title = '🎫 Limit Leaderboard'
            break
        default:
            sorted.sort((a, b) => (b.exp || 0) - (a.exp || 0))
            title = '🏆 EXP Leaderboard'
    }
    
    // Top 3
    const top3 = sorted.slice(0, 3)
    const firstName = getElement('firstName')
    const firstValue = getElement('firstValue')
    const secondName = getElement('secondName')
    const secondValue = getElement('secondValue')
    const thirdName = getElement('thirdName')
    const thirdValue = getElement('thirdValue')
    
    if (firstName && top3[0]) firstName.innerHTML = top3[0].name || top3[0].number
    if (firstValue && top3[0]) firstValue.innerHTML = `${type}: ${(top3[0][type] || 0).toLocaleString()}`
    if (secondName && top3[1]) secondName.innerHTML = top3[1].name || top3[1].number
    if (secondValue && top3[1]) secondValue.innerHTML = `${type}: ${(top3[1][type] || 0).toLocaleString()}`
    if (thirdName && top3[2]) thirdName.innerHTML = top3[2].name || top3[2].number
    if (thirdValue && top3[2]) thirdValue.innerHTML = `${type}: ${(top3[2][type] || 0).toLocaleString()}`
    
    // Full list (top 50)
    const top50 = sorted.slice(0, 50)
    const tbody = getElement('leaderboardList')
    if (tbody) {
        tbody.innerHTML = top50.map((user, idx) => `
            <tr>
                <td><strong>${idx + 1}</strong> ${getRankIcon(idx + 1)}</td>
                <td><i class="bi bi-person-circle"></i> ${escapeHtml(user.name || user.number)}</td>
                <td>${escapeHtml(user.number)}</td>
                <td><strong>${(user[type] || 0).toLocaleString()}</strong></td>
                <td>${user.isPremium ? '<span class="badge bg-warning text-dark">Premium</span>' : '<span class="badge bg-secondary">Free</span>'}</td>
            </tr>
        `).join('')
    }
}

function getRankIcon(rank) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return ''
}

// Update users table
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

// Update groups table
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

// Update commands table
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

// Update system info
function updateSystemInfo(system) {
    if (!system) return
    
    const elements = ['nodeVersion', 'platform', 'cpuCores', 'memoryRSS', 'heapTotal', 'heapUsed', 'external']
    elements.forEach(el => {
        const elem = getElement(el)
        if (elem && system[el]) elem.innerHTML = system[el]
    })
    
    const uptimeElem = getElement('systemUptime')
    if (uptimeElem && system.uptime) {
        const days = Math.floor(system.uptime / 86400)
        const hours = Math.floor((system.uptime % 86400) / 3600)
        const minutes = Math.floor((system.uptime % 3600) / 60)
        uptimeElem.innerHTML = `${days}d ${hours}h ${minutes}m`
    }
    
    if (system.memoryUsage) {
        const memoryStatus = getElement('memoryStatus')
        if (memoryStatus) {
            const usagePercent = (system.memoryUsage.heapUsed / system.memoryUsage.heapTotal) * 100
            memoryStatus.innerHTML = usagePercent > 80 ? '⚠️ High Usage' : '✅ Normal'
            memoryStatus.className = usagePercent > 80 ? 'text-warning' : 'text-success'
        }
    }
}

// Update pagination
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

async function refreshData() {
    setInnerHTML('usersList', '<tr><td colspan="6" class="text-center"><div class="spinner-border text-warning"></div> Loading...</td></tr>')
    await loadAllData()
    const refreshTime = getElement('refreshTime')
    if (refreshTime) refreshTime.innerHTML = new Date().toLocaleTimeString()
}

async function testConnection() {
    const toast = document.createElement('div')
    toast.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 p-3 rounded-3'
    toast.style.background = '#1a1a2e'
    toast.style.border = '1px solid rgba(255,215,0,0.3)'
    toast.style.zIndex = '9999'
    toast.style.minWidth = '300px'
    toast.innerHTML = '<i class="bi bi-hourglass-split"></i> Checking...'
    document.body.appendChild(toast)
    
    try {
        const response = await fetch('/api/health')
        const data = await response.json()
        toast.innerHTML = data.status === 'connected' 
            ? '<i class="bi bi-check-circle text-success"></i> Connected to Bot!'
            : '<i class="bi bi-clock text-warning"></i> Waiting for bot data...'
        toast.style.borderColor = data.status === 'connected' ? '#4caf50' : '#ff9800'
    } catch (error) {
        toast.innerHTML = '<i class="bi bi-exclamation-triangle text-danger"></i> Connection failed!'
        toast.style.borderColor = '#f44336'
    }
    setTimeout(() => toast.remove(), 3000)
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

// Event listeners
const userLimit = getElement('userLimit')
if (userLimit) userLimit.addEventListener('change', (e) => {
    currentLimit = parseInt(e.target.value)
    currentPage = 1
    if (allData.users) updateUsersTable(allData.users)
})

const commandCategory = getElement('commandCategory')
if (commandCategory) commandCategory.addEventListener('change', () => {
    if (allData.commands) updateCommandsTable(allData.commands)
})

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

// Auto refresh
setInterval(() => loadAllData(), 30000)
setInterval(updateLiveTime, 1000)

// Initial load
updateLiveTime()
loadAllData()
