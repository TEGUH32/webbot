// Dashboard JavaScript
let currentPage = 1
let currentLimit = 50
let totalPages = 1
let allCommands = []

// Test connection to bot
async function testConnection() {
    const toast = document.createElement('div')
    toast.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3'
    toast.style.zIndex = '9999'
    toast.innerHTML = '<i class="bi bi-hourglass-split"></i> Testing connection...'
    document.body.appendChild(toast)
    
    try {
        const response = await fetch('/api/health')
        const data = await response.json()
        
        if (data.status === 'connected') {
            toast.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.innerHTML = '<i class="bi bi-check-circle"></i> Connected to Bot API!'
        } else {
            toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3'
            toast.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Cannot connect to Bot API!'
        }
    } catch (error) {
        toast.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3'
        toast.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Connection failed: ' + error.message
    }
    
    setTimeout(() => toast.remove(), 3000)
}

// Fetch data from API
async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(`/api/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })
        
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || `HTTP ${response.status}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error)
        return null
    }
}

// Load stats
async function loadStats() {
    const stats = await fetchData('stats')
    if (stats) {
        document.getElementById('totalUsers').textContent = stats.totalUsers?.toLocaleString() || 0
        document.getElementById('premiumUsers').textContent = stats.premiumUsers?.toLocaleString() || 0
        document.getElementById('totalGroups').textContent = stats.totalGroups?.toLocaleString() || 0
        document.getElementById('totalCommands').textContent = stats.totalCommands?.toLocaleString() || 0
        document.getElementById('botStatus').innerHTML = 'Online ✅'
        document.getElementById('botStatus').className = 'status-online'
    } else {
        document.getElementById('botStatus').innerHTML = 'Offline ❌'
        document.getElementById('botStatus').className = 'status-offline'
    }
}

// Load groups
async function loadGroups() {
    const groups = await fetchData('groups')
    const tbody = document.getElementById('groupsList')
    
    if (groups && groups.length > 0) {
        tbody.innerHTML = groups.map(g => `
            <tr>
                <td><i class="bi bi-chat-dots"></i> ${escapeHtml(g.name)}</td>
                <td><small>${escapeHtml(g.id)}</small></td>
                <td>${g.members || 0}</td>
                <td>
                    ${g.welcome ? '<span class="badge bg-success me-1">Welcome</span>' : ''}
                    ${g.antiLink ? '<span class="badge bg-warning me-1">Anti Link</span>' : ''}
                </td>
                <td>${g.isBanned ? '<span class="badge bg-danger">Banned</span>' : '<span class="badge bg-success">Active</span>'}</td>
            </tr>
        `).join('')
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No groups found</td></tr>'
    }
}

// Load commands
async function loadCommands() {
    const commands = await fetchData('commands')
    if (commands) {
        allCommands = commands
        filterCommands()
    }
}

// Filter commands by category
function filterCommands() {
    const category = document.getElementById('commandCategory')?.value || 'all'
    const filtered = category === 'all' ? allCommands : allCommands.filter(c => c.category === category)
    const tbody = document.getElementById('commandsList')
    
    if (filtered.length > 0) {
        tbody.innerHTML = filtered.map(c => `
            <tr>
                <td><code>${escapeHtml(c.name)}</code></td>
                <td><span class="badge bg-secondary">${escapeHtml(c.category)}</span></td>
                <td>
                    ${c.isPremium ? '<span class="badge bg-warning">Premium</span>' : '<span class="badge bg-info">Free</span>'}
                    ${c.isOwner ? '<span class="badge bg-danger">Owner</span>' : ''}
                </td>
                <td><small>${escapeHtml(c.description)}</small></td>
            </tr>
        `).join('')
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No commands found</td></tr>'
    }
}

// Load users
async function loadUsers(page = 1) {
    const searchQuery = document.getElementById('searchUser')?.value || ''
    let url = `users?page=${page}&limit=${currentLimit}`
    if (searchQuery) {
        url = `search?q=${encodeURIComponent(searchQuery)}`
    }
    
    const data = await fetchData(url)
    
    if (data && data.users) {
        const users = data.users
        const tbody = document.getElementById('usersList')
        
        if (users.length > 0) {
            tbody.innerHTML = users.map(u => `
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
        
        document.getElementById('userCount').textContent = `Total: ${data.total || users.length} users`
        
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
    loadUsers(currentPage)
}

// Refresh all data
function refreshData() {
    loadStats()
    loadGroups()
    loadCommands()
    loadUsers(currentPage)
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

// Initial load
refreshData()

// Auto refresh every 30 seconds
setInterval(() => {
    loadStats()
}, 30000)
