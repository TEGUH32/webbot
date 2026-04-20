// public/dashboard.js
// Dashboard JavaScript dengan auto refresh

let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allCommands = []
let refreshInterval = null

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
            toast.innerHTML = '<i class="bi bi-check-circle"></i> Bot Connected! Last update: ' + new Date(data.lastUpdate).toLocaleString()
            document.getElementById('botStatus').innerHTML = 'Online ✅'
            document.getElementById('botStatus').className = 'status-online'
        } else {
            toast.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.innerHTML = '<i class="bi bi-clock"></i> Waiting for bot data...'
            document.getElementById('botStatus').innerHTML = 'Waiting for data... ⏳'
            document.getElementById('botStatus').className = 'status-warning'
        }
    } catch (error) {
        toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3'
        toast.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Connection error: ' + error.message
        document.getElementById('botStatus').innerHTML = 'Offline ❌'
        document.getElementById('botStatus').className = 'status-offline'
    }
    
    setTimeout(() => toast.remove(), 3000)
}

// Fetch data dari API
async function fetchData(endpoint) {
    try {
        const response = await fetch(`/api/${endpoint}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error)
        return null
    }
}

// Load all stats
async function loadStats() {
    const stats = await fetchData('stats')
    if (stats) {
        document.getElementById('totalUsers').textContent = (stats.totalUsers || 0).toLocaleString()
        document.getElementById('premiumUsers').textContent = (stats.premiumUsers || 0).toLocaleString()
        document.getElementById('totalGroups').textContent = (stats.totalGroups || 0).toLocaleString()
        document.getElementById('totalCommands').textContent = (stats.totalCommands || 0).toLocaleString()
        document.getElementById('activeUsers').textContent = (stats.activeUsers || 0).toLocaleString()
        
        if (stats.lastUpdate) {
            const lastUpdate = new Date(stats.lastUpdate)
            document.getElementById('lastUpdate').textContent = lastUpdate.toLocaleString()
        }
    }
}

// Load groups
async function loadGroups() {
    const groups = await fetchData('groups')
    const tbody = document.getElementById('groupsList')
    
    if (tbody) {
        if (groups && groups.length > 0) {
            tbody.innerHTML = groups.map(g => `
                <tr>
                    <td><i class="bi bi-chat-dots"></i> ${escapeHtml(g.name)}</td>
                    <td><small>${escapeHtml(g.id)}</small></td>
                    <td>${g.members || 0}</td>
                    <td>${g.isBanned ? '<span class="badge bg-danger">Banned</span>' : '<span class="badge bg-success">Active</span>'}</td>
                </tr>
            `).join('')
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No groups found</td></tr>'
        }
    }
}

// Load commands
async function loadCommands() {
    const commands = await fetchData('commands')
    if (commands && commands.length > 0) {
        allCommands = commands
        filterCommands()
    }
}

// Filter commands by category
function filterCommands() {
    const category = document.getElementById('commandCategory')?.value || 'all'
    const filtered = category === 'all' ? allCommands : allCommands.filter(c => c.category === category)
    const tbody = document.getElementById('commandsList')
    
    if (tbody) {
        if (filtered.length > 0) {
            tbody.innerHTML = filtered.map(c => `
                <tr>
                    <td><code>${escapeHtml(c.name)}</code></td>
                    <td><span class="badge bg-secondary">${escapeHtml(c.category)}</span></td>
                    <td>${c.isPremium ? '<span class="badge bg-warning">Premium</span>' : '<span class="badge bg-info">Free</span>'}</td>
                    <td><small>${escapeHtml(c.description || '-')}</small></td>
                </tr>
            `).join('')
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
        }
    }
}

// Load users with pagination
async function loadUsers(page = 1) {
    const searchQuery = document.getElementById('searchUser')?.value || ''
    let url = `users?page=${page}&limit=${currentLimit}`
    if (searchQuery) {
        url = `users?search=${encodeURIComponent(searchQuery)}&page=1&limit=${currentLimit}`
    }
    
    const data = await fetchData(url)
    
    if (data && data.users) {
        const tbody = document.getElementById('usersList')
        
        if (tbody) {
            if (data.users.length > 0) {
                tbody.innerHTML = data.users.map(u => `
                    <tr>
                        <td><i class="bi bi-person-circle"></i> ${escapeHtml(u.name)}</td>
                        <td>${escapeHtml(u.number)}</td>
                        <td>${u.isPremium ? '<span class="badge bg-warning">✓ Premium</span>' : '<span class="badge bg-secondary">Free</span>'}</td>
                        <td>Level ${u.level}</td>
                        <td>💰 ${(u.money || 0).toLocaleString()}</td>
                        <td>🎫 ${(u.limit || 0).toLocaleString()}</td>
                    </tr>
                `).join('')
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>'
            }
        }
        
        const userCount = document.getElementById('userCount')
        if (userCount) {
            userCount.textContent = `Total: ${data.total} users`
        }
        
        if (!searchQuery && data.totalPages) {
            totalPages = data.totalPages
            renderPagination()
        }
    }
}

// Render pagination
function renderPagination() {
    const pagination = document.getElementById('pagination')
    if (!pagination) return
    
    pagination.innerHTML = ''
    
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})">Previous</button>
        </li>
    `
    
    let startPage = Math.max(1, currentPage - 2)
    let endPage = Math.min(totalPages, currentPage + 2)
    
    for (let i = startPage; i <= endPage; i++) {
        pagination.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `
    }
    
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
    loadUsers(currentPage)
}

// Refresh all data
async function refreshData() {
    await loadStats()
    await loadGroups()
    await loadCommands()
    await loadUsers(currentPage)
    
    // Update last refresh time
    const now = new Date()
    const refreshTime = document.getElementById('refreshTime')
    if (refreshTime) {
        refreshTime.textContent = now.toLocaleTimeString()
    }
}

// Start auto refresh
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval)
    refreshInterval = setInterval(() => {
        refreshData()
    }, 30000) // Refresh setiap 30 detik
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return ''
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;'
        if (m === '<') return '&lt;'
        if (m === '>') return '&gt;'
        return m
    })
}

// Event listeners
document.getElementById('userLimit')?.addEventListener('change', (e) => {
    currentLimit = parseInt(e.target.value)
    currentPage = 1
    loadUsers(currentPage)
})

document.getElementById('commandCategory')?.addEventListener('change', () => {
    filterCommands()
})

let searchTimeout
document.getElementById('searchUser')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        currentPage = 1
        loadUsers(currentPage)
    }, 500)
})

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

// Initial load
refreshData()
startAutoRefresh()
testConnection()

// Update time every second
setInterval(updateLiveTime, 1000)
updateLiveTime()
