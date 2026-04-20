// api/comments.js
// Public chat system with permanent likes

import fs from 'fs'
import path from 'path'

const COMMENTS_FILE = path.join(process.cwd(), 'tmp', 'comments.json')

// Data awal
let comments = []

// Load comments from file
function loadComments() {
    try {
        if (fs.existsSync(COMMENTS_FILE)) {
            const data = fs.readFileSync(COMMENTS_FILE, 'utf8')
            comments = JSON.parse(data)
            return comments
        }
    } catch (e) {}
    return []
}

// Save comments to file
function saveComments() {
    try {
        const dir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2))
    } catch (e) {}
}

// Verified users list (centang biru)
const verifiedUsers = [
    { name: 'Teguh', badge: '👑 Owner', color: '#FFD700' },
    { name: 'Admin', badge: '⭐ Admin', color: '#667eea' },
    { name: 'Moderator', badge: '🛡️ Mod', color: '#4caf50' },
    { name: 'Alecia', badge: '🤖 Bot', color: '#764ba2' }
]

function isVerified(name) {
    return verifiedUsers.find(u => u.name.toLowerCase() === name.toLowerCase())
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    loadComments()
    
    // GET - ambil semua komentar
    if (req.method === 'GET') {
        const { limit = 200 } = req.query
        const sortedComments = [...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        return res.status(200).json({
            success: true,
            comments: sortedComments.slice(0, parseInt(limit)),
            total: comments.length,
            verifiedUsers: verifiedUsers
        })
    }
    
    // POST - tambah komentar baru
    if (req.method === 'POST') {
        try {
            const { name, message } = req.body
            
            if (!name || !message) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nama dan pesan wajib diisi!' 
                })
            }
            
            if (name.length > 25) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nama terlalu panjang! Maksimal 25 karakter.' 
                })
            }
            
            if (message.length > 500) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Pesan terlalu panjang! Maksimal 500 karakter.' 
                })
            }
            
            const verified = isVerified(name)
            
            const newComment = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: name.substring(0, 25),
                message: message.substring(0, 500),
                timestamp: new Date().toISOString(),
                isVerified: !!verified,
                verifiedBadge: verified ? verified.badge : null,
                verifiedColor: verified ? verified.color : null,
                likes: 0,
                likedBy: []
            }
            
            comments.unshift(newComment)
            
            // Batasi jumlah komentar (maksimal 500)
            if (comments.length > 500) {
                comments = comments.slice(0, 500)
            }
            
            saveComments()
            
            return res.status(200).json({
                success: true,
                message: 'Komentar berhasil ditambahkan!',
                comment: newComment
            })
            
        } catch (error) {
            console.error('Error:', error)
            return res.status(500).json({ 
                success: false, 
                error: error.message 
            })
        }
    }
    
    // POST - like/unlike komentar
    if (req.method === 'POST' && req.url === '/api/comments/like') {
        try {
            const { id, name } = req.body
            
            const commentIndex = comments.findIndex(c => c.id === id)
            if (commentIndex === -1) {
                return res.status(404).json({ success: false, error: 'Comment not found' })
            }
            
            const comment = comments[commentIndex]
            const hasLiked = comment.likedBy && comment.likedBy.includes(name)
            
            if (hasLiked) {
                // Unlike
                comment.likes = (comment.likes || 0) - 1
                comment.likedBy = comment.likedBy.filter(n => n !== name)
            } else {
                // Like
                comment.likes = (comment.likes || 0) + 1
                if (!comment.likedBy) comment.likedBy = []
                comment.likedBy.push(name)
            }
            
            saveComments()
            
            return res.status(200).json({
                success: true,
                likes: comment.likes,
                liked: !hasLiked
            })
            
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message })
        }
    }
    
    // DELETE - hapus komentar
    if (req.method === 'DELETE') {
        try {
            const { id, name } = req.query
            
            const verified = isVerified(name)
            const commentIndex = comments.findIndex(c => c.id === id)
            
            if (commentIndex === -1) {
                return res.status(404).json({ success: false, error: 'Comment not found' })
            }
            
            const comment = comments[commentIndex]
            
            // Hanya verified user atau pemilik komentar yang bisa hapus
            if (!verified && comment.name !== name) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Anda tidak memiliki izin untuk menghapus komentar ini!' 
                })
            }
            
            comments.splice(commentIndex, 1)
            saveComments()
            
            return res.status(200).json({
                success: true,
                message: 'Komentar berhasil dihapus!'
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
