// api/users.js
import axios from 'axios'

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    const { page = 1, limit = 50, search = '' } = req.query
    
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers['host']
        const baseUrl = `${protocol}://${host}`
        
        const response = await axios.get(`${baseUrl}/api/bot-data`)
        const data = response.data
        let users = data.users || []
        
        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase()
            users = users.filter(u => 
                u.name?.toLowerCase().includes(searchLower) || 
                u.number?.includes(search)
            )
        }
        
        // Pagination
        const start = (parseInt(page) - 1) * parseInt(limit)
        const paginatedUsers = users.slice(start, start + parseInt(limit))
        
        res.status(200).json({
            users: paginatedUsers,
            total: users.length,
            page: parseInt(page),
            totalPages: Math.ceil(users.length / parseInt(limit))
        })
    } catch (error) {
        console.error('Error fetching users:', error.message)
        res.status(200).json({
            users: [],
            total: 0,
            page: 1,
            totalPages: 0
        })
    }
}
