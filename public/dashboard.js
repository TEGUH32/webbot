// public/dashboard.js
// Dashboard JavaScript - FIXED VERSION

let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allData = {
    stats: {},
    users: [],
    groups: [],
    commands: []
}

// Load semua data dari API
async function loadAllData() {
    try {
        // Ambil data dari API bot-data
        const response = await fetch('/api/bot-data')
        const data = await response.json()
        
        console.log('Data received:', data)
        
        if (data) {
            allData = data
            
            // Update stats
            updateStats(data.stats)
            
            // Update users
            if (data.users && data.users.length > 0) {
                updateUsersTable(data.users)
                document.getElementById('userCount').innerHTML = `Total: ${data.users.length} users`
            } else {
                document.getElementById('usersList').innerHTML = '<tr><td colspan="6" class="text-center">No users found in database</td></tr>'
                document.getElementById('userCount').innerHTML = `Total: 0 users`
            }
            
            // Update groups
            if (data.groups && data.groups.length > 0) {
                updateGroupsTable(data.groups)
            } else {
                document.getElementById('groupsList').innerHTML = '<tr><td colspan="4" class="text-center">No groups found</td></tr>'
            }
            
            // Update commands
            if (data.commands && data.commands.length > 0) {
                updateCommandsTable(data.commands)
            } else {
                document.getElementById('commandsList').innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
            }
            
            // Update status
            document.getElementById('botStatus').innerHTML = 'Online ✅'
            document.getElementById('botStatus').className = 'status-online'
            
            if (data.stats && data.stats.lastUpdate) {
                document.getElementById('lastUpdate').innerHTML = new Date(data.stats.lastUpdate).toLocaleString()
            }
        }
    } catch (error) {
        console.error('Error loading data:', error)
        document.getElementById('botStatus').innerHTML = 'Error loading data ❌'
        document.getElementById('usersList').innerHTML = '<tr><td colspan="6" class="text-center">Error: ' + error.message + '</td></tr>'
    }
}

// Update stats cards
function updateStats(stats) {
    if (stats) {
        document.getElementById('totalUsers').innerHTML = (stats.totalUsers || 0).toLocaleString()
        document.getElementById('premiumUsers').innerHTML = (stats.premiumUsers || 0).toLocaleString()
        document.getElementById('totalGroups').innerHTML = (stats.totalGroups || 0).toLocaleString()
        document.getElementById('totalCommands').innerHTML = (stats.totalCommands || 0).toLocaleString()
        document.getElementById('activeUsers').innerHTML = (stats.activeUsers || 0).toLocaleString()
    }
}

// Update users table
function updateUsersTable(users) {
    const tbody = document.getElementById('usersList')
    if (!tbody) return
    
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
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>'
    }
    
    // Update pagination
    totalPages = Math.ceil(users.length / currentLimit)
    updatePagination()
}

// Update groups table
function updateGroupsTable(groups) {
    const tbody = document.getElementById('groupsList')
    if (!tbody) return
    
    if (groups.length > 0) {
        tbody.innerHTML = groups.map(group => `
            <tr>
                <td><i class="bi bi-chat-dots"></i> ${escapeHtml(group.name)}</td>
                <td><small>${escapeHtml(group.id)}</small></td>
                <td>${group.members || 0}</td>
                <td>${group.isBanned ? '<span class="badge bg-danger">Banned</span>' : '<span class="badge bg-success">Active</span>'}</td>
            </tr>
        `).join('')
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No groups found</td></tr>'
    }
}

// Update commands table
function updateCommandsTable(commands) {
    const tbody = document.getElementById('commandsList')
    if (!tbody) return
    
    // Filter by category
    const category = document.getElementById('commandCategory')?.value || 'all'
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
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
    }
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination')
    if (!pagination) return
    
    pagination.innerHTML = ''
    
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
    document.getElementById('usersList').innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>'
    await loadAllData()
    document.getElementById('refreshTime').innerHTML = new Date().toLocaleTimeString()
}

// Test connection
async function testConnection() {
    const toast = document.createElement('div')
    toast.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3'
    toast.style.zIndex = '9999'
    toast.style.minWidth = '300px'
    toast.innerHTML = '<i class="bi bi-hourglass-split"></i> Checking connection...'
    document.body.appendChild(toast)
    
    try {
        const response = await fetch('/api/health')
        const data = await response.json()
        
        if (data.status === 'connected') {
            toast.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.innerHTML = '<i class="bi bi-check-circle"></i> Connected! Last update: ' + new Date(data.lastUpdate).toLocaleString()
        } else {
            toast.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.innerHTML = '<i class="bi bi-clock"></i> Waiting for bot data...'
        }
    } catch (error) {
        toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3'
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
    const liveTime = document.getElementById('liveTime')
    if (liveTime) liveTime.textContent = timeStr
}

// Event listeners
document.getElementById('userLimit')?.addEventListener('change', (e) => {
    currentLimit = parseInt(e.target.value)
    currentPage = 1
    if (allData.users) {
        updateUsersTable(allData.users)
    }
})

document.getElementById('commandCategory')?.addEventListener('change', () => {
    if (allData.commands) {
        updateCommandsTable(allData.commands)
    }
})

document.getElementById('searchUser')?.addEventListener('input', (e) => {
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
})

// Auto refresh setiap 30 detik
setInterval(() => {
    loadAllData()
}, 30000)

// Update time every second
setInterval(updateLiveTime, 1000)

// Initial load
updateLiveTime()
loadAllData()
