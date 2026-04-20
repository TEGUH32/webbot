// public/dashboard.js
// Alecia Dashboard - Full Working Version

let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allData = {
    stats: {},
    users: [],
    groups: [],
    commands: []
}

// Safe function to get element
function getElement(id) {
    const el = document.getElementById(id)
    if (!el) {
        console.warn(`Element ${id} not found`)
    }
    return el
}

// Safe function to set innerHTML
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
            
            // Update stats
            if (data.stats) {
                updateStats(data.stats)
            }
            
            // Update users
            if (data.users && Array.isArray(data.users)) {
                updateUsersTable(data.users)
                const userCount = getElement('userCount')
                if (userCount) userCount.innerHTML = `<i class="bi bi-database"></i> Total: ${data.users.length} users`
            } else {
                setInnerHTML('usersList', '<tr><td colspan="6" class="text-center">No users found in database</td></tr>')
                if (getElement('userCount')) getElement('userCount').innerHTML = `<i class="bi bi-database"></i> Total: 0 users`
            }
            
            // Update groups
            if (data.groups && Array.isArray(data.groups)) {
                updateGroupsTable(data.groups)
            } else {
                setInnerHTML('groupsList', '<tr><td colspan="4" class="text-center">No groups found</td></tr>')
            }
            
            // Update commands
            if (data.commands && Array.isArray(data.commands)) {
                updateCommandsTable(data.commands)
                const cmdCount = getElement('commandCount')
                if (cmdCount) cmdCount.innerHTML = `<i class="bi bi-terminal"></i> Total: ${data.commands.length} commands`
            } else {
                setInnerHTML('commandsList', '<tr><td colspan="4" class="text-center">No commands found</td></tr>')
                if (getElement('commandCount')) getElement('commandCount').innerHTML = `<i class="bi bi-terminal"></i> Total: 0 commands`
            }
            
            // Update system info
            if (data.system) {
                updateSystemInfo(data.system)
            }
            
            // Update status
            const botStatus = getElement('botStatus')
            if (botStatus) {
                botStatus.innerHTML = 'Online ✅'
                botStatus.className = 'status-online'
            }
            
            if (data.stats && data.stats.lastUpdate) {
                const lastUpdate = getElement('lastUpdate')
                if (lastUpdate) lastUpdate.innerHTML = new Date(data.stats.lastUpdate).toLocaleString()
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
        const botStatus = getElement('botStatus')
        if (botStatus) {
            botStatus.innerHTML = 'Error ❌'
            botStatus.className = 'status-offline'
        }
        setInnerHTML('usersList', `<tr><td colspan="6" class="text-center">Error: ${error.message}</td></tr>`)
    }
}

// Update stats cards
function updateStats(stats) {
    const totalUsers = getElement('totalUsers')
    const premiumUsers = getElement('premiumUsers')
    const totalGroups = getElement('totalGroups')
    const totalCommands = getElement('totalCommands')
    
    if (totalUsers) totalUsers.innerHTML = (stats.totalUsers || 0).toLocaleString()
    if (premiumUsers) premiumUsers.innerHTML = (stats.premiumUsers || 0).toLocaleString()
    if (totalGroups) totalGroups.innerHTML = (stats.totalGroups || 0).toLocaleString()
    if (totalCommands) totalCommands.innerHTML = (stats.totalCommands || 0).toLocaleString()
}

// Update users table
function updateUsersTable(users) {
    const tbody = getElement('usersList')
    if (!tbody) return
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>'
        return
    }
    
    // Pagination
    const start = (currentPage - 1) * currentLimit
    const end = start + currentLimit
    const paginatedUsers = users.slice(start, end)
    
    if (paginatedUsers.length > 0) {
        tbody.innerHTML = paginatedUsers.map(user => `
            <tr>
                <td><i class="bi bi-person-circle"></i> ${escapeHtml(user.name || user.number)}</td>
                <td>${escapeHtml(user.number)}</td>
                <td>${user.isPremium ? '<span class="badge bg-warning">✓ Premium</span>' : '<span class="badge bg-secondary">Free</span>'}</td>
                <td>Level ${user.level || 0}</td>
                <td>💰 ${(user.money || 0).toLocaleString()}</td>
                <td>🎫 ${(user.limit || 0).toLocaleString()}</td>
            </tr>
        `).join('')
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users on this page</td></tr>'
    }
    
    // Update pagination
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
    
    if (!commands || commands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
        return
    }
    
    // Filter by category
    const categorySelect = getElement('commandCategory')
    const category = categorySelect ? categorySelect.value : 'all'
    const filtered = category === 'all' ? commands : commands.filter(c => c.category === category)
    
    if (filtered.length > 0) {
        tbody.innerHTML = filtered.map(cmd => `
            <tr>
                <td><code>${escapeHtml(cmd.name)}</code></td>
                <td><span class="badge bg-secondary">${escapeHtml(cmd.category)}</span></td>
                <td>${cmd.isPremium ? '<span class="badge bg-warning">Premium</span>' : '<span class="badge bg-info">Free</span>'}</td>
                <td><small>${escapeHtml(cmd.description || '-')}</small></td>
            </tr>
        `).join('')
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands in this category</td></tr>'
    }
}

// Update system info
function updateSystemInfo(system) {
    if (!system) return
    
    const nodeVersion = getElement('nodeVersion')
    const platform = getElement('platform')
    const cpuCores = getElement('cpuCores')
    const uptime = getElement('uptime')
    const memoryUsage = getElement('memoryUsage')
    const heapTotal = getElement('heapTotal')
    const heapUsed = getElement('heapUsed')
    const external = getElement('external')
    
    if (nodeVersion) nodeVersion.innerHTML = system.nodeVersion || '-'
    if (platform) platform.innerHTML = system.platform || '-'
    if (cpuCores) cpuCores.innerHTML = system.cpuCores || '-'
    
    if (uptime && system.uptime) {
        const days = Math.floor(system.uptime / 86400)
        const hours = Math.floor((system.uptime % 86400) / 3600)
        const minutes = Math.floor((system.uptime % 3600) / 60)
        uptime.innerHTML = `${days}d ${hours}h ${minutes}m`
    }
    
    if (system.memoryUsage) {
        if (memoryUsage) memoryUsage.innerHTML = formatBytes(system.memoryUsage.rss)
        if (heapTotal) heapTotal.innerHTML = formatBytes(system.memoryUsage.heapTotal)
        if (heapUsed) heapUsed.innerHTML = formatBytes(system.memoryUsage.heapUsed)
        if (external) external.innerHTML = formatBytes(system.memoryUsage.external)
    }
}

// Format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Update pagination
function updatePagination() {
    const pagination = getElement('pagination')
    if (!pagination) return
    
    pagination.innerHTML = ''
    
    if (totalPages <= 1) return
    
    // Previous button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
        </li>
    `
    
    // Page numbers
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)
    
    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `
    }
    
    // Next button
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage + 1})">Next</button>
        </li>
    `
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages) return
    currentPage = page
    if (allData.users) {
        updateUsersTable(allData.users)
    }
}

// Refresh data
async function refreshData() {
    const refreshTime = getElement('refreshTime')
    if (refreshTime) refreshTime.innerHTML = 'Refreshing...'
    
    setInnerHTML('usersList', '<tr><td colspan="6" class="text-center"><div class="spinner"></div> Loading...</td></tr>')
    
    await loadAllData()
    
    if (refreshTime) refreshTime.innerHTML = new Date().toLocaleTimeString()
}

// Test connection
async function testConnection() {
    const toast = document.createElement('div')
    toast.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3'
    toast.style.zIndex = '9999'
    toast.style.minWidth = '300px'
    toast.style.background = 'rgba(0,0,0,0.9)'
    toast.style.color = 'white'
    toast.style.borderRadius = '15px'
    toast.style.backdropFilter = 'blur(10px)'
    toast.innerHTML = '<i class="bi bi-hourglass-split"></i> Checking connection...'
    document.body.appendChild(toast)
    
    try {
        const response = await fetch('/api/health')
        const data = await response.json()
        
        if (data.status === 'connected') {
            toast.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.style.background = 'rgba(76,175,80,0.9)'
            toast.innerHTML = '<i class="bi bi-check-circle"></i> Connected! Last update: ' + new Date(data.lastUpdate).toLocaleString()
        } else {
            toast.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.style.background = 'rgba(255,152,0,0.9)'
            toast.innerHTML = '<i class="bi bi-clock"></i> Waiting for bot data...'
        }
    } catch (error) {
        toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3'
        toast.style.background = 'rgba(244,67,54,0.9)'
        toast.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Error: ' + error.message
    }
    
    setTimeout(() => toast.remove(), 3000)
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'
        if (m === '<') return '&lt;'
        if (m === '>') return '&gt;'
        return m
    })
}

// Update live time
function updateLiveTime() {
    const now = new Date()
    const timeStr = now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
    const liveTime = getElement('liveTime')
    if (liveTime) liveTime.textContent = timeStr
}

// Event listeners
const userLimit = getElement('userLimit')
if (userLimit) {
    userLimit.addEventListener('change', (e) => {
        currentLimit = parseInt(e.target.value)
        currentPage = 1
        if (allData.users) {
            updateUsersTable(allData.users)
        }
    })
}

const commandCategory = getElement('commandCategory')
if (commandCategory) {
    commandCategory.addEventListener('change', () => {
        if (allData.commands) {
            updateCommandsTable(allData.commands)
        }
    })
}

const searchUser = getElement('searchUser')
if (searchUser) {
    let searchTimeout
    searchUser.addEventListener('input', (e) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
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

// Auto refresh every 30 seconds
setInterval(() => {
    loadAllData()
}, 30000)

// Update time every second
setInterval(updateLiveTime, 1000)

// Initial load
updateLiveTime()
loadAllData()
