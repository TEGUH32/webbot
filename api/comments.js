// api/comments.js
// Public chat/comments system with verified badge

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
    { name: 'Teguh', number: '6281234567890', badge: '👑 Owner' },
    { name: 'Admin', number: '6289876543210', badge: '⭐ Admin' },
    { name: 'Moderator', number: '6285555555555', badge: '🛡️ Mod' }
]

function isVerified(name, number) {
    return verifiedUsers.find(u => u.name.toLowerCase() === name.toLowerCase() || u.number === number)
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // Load comments
    loadComments()
    
    // GET - ambil semua komentar
    if (req.method === 'GET') {
        const { limit = 100 } = req.query
        const sortedComments = [...comments].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        return res.status(200).json({
            success: true,
            comments: sortedComments.slice(0, parseInt(limit)),
            total: comments.length,
            verifiedUsers: verifiedUsers.map(u => ({ name: u.name, badge: u.badge }))
        })
    }
    
    // POST - tambah komentar baru
    if (req.method === 'POST') {
        try {
            const { name, message, number } = req.body
            
            if (!name || !message) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nama dan pesan wajib diisi!' 
                })
            }
            
            if (message.length > 500) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Pesan terlalu panjang! Maksimal 500 karakter.' 
                })
            }
            
            // Cek verified
            const verified = isVerified(name, number)
            
            const newComment = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: name,
                message: message.substring(0, 500),
                number: number || null,
                timestamp: new Date().toISOString(),
                isVerified: !!verified,
                verifiedBadge: verified ? verified.badge : null,
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
    
    // DELETE - hapus komentar (hanya untuk verified)
    if (req.method === 'DELETE') {
        try {
            const { id, name, number } = req.query
            
            const verified = isVerified(name, number)
            if (!verified) {
                return res.status(403).json({ 
                    success: false, 
                    error: 'Only verified users can delete comments!' 
                })
            }
            
            const commentIndex = comments.findIndex(c => c.id === id)
            if (commentIndex === -1) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Comment not found' 
                })
            }
            
            comments.splice(commentIndex, 1)
            saveComments()
            
            return res.status(200).json({
                success: true,
                message: 'Comment deleted!'
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
