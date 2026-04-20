const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const path = require('path')
const axios = require('axios')
const WebSocket = require('ws')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// Config
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:5000'
const BOT_WS_URL = process.env.BOT_WS_URL || 'ws://localhost:5000'
const PORT = process.env.PORT || 3000

let botData = {
    stats: {},
    groups: [],
    commands: [],
    users: [],
    system: {}
}

// Koneksi ke Bot API via WebSocket
let botWS = null

function connectToBot() {
    console.log(`🔌 Connecting to bot API at ${BOT_WS_URL}...`)
    
    botWS = new WebSocket(BOT_WS_URL)
    
    botWS.on('open', () => {
        console.log('✅ Connected to WhatsApp Bot API')
    })
    
    botWS.on('message', (data) => {
        try {
            const message = JSON.parse(data)
            if (message.type === 'init' || message.type === 'update') {
                botData = { ...botData, ...message.data }
                // Broadcast ke semua client web
                io.emit('botUpdate', botData)
            }
        } catch(e) {}
    })
    
    botWS.on('error', (err) => {
        console.error('WebSocket error:', err.message)
    })
    
    botWS.on('close', () => {
        console.log('❌ Disconnected from bot API, reconnecting in 5 seconds...')
        setTimeout(connectToBot, 5000)
    })
}

// API Routes (proxy ke bot)
app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/stats`)
        res.json(response.data)
    } catch(e) {
        res.json(botData.stats)
    }
})

app.get('/api/groups', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/groups`)
        res.json(response.data)
    } catch(e) {
        res.json(botData.groups)
    }
})

app.get('/api/commands', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/commands`)
        res.json(response.data)
    } catch(e) {
        res.json(botData.commands)
    }
})

app.get('/api/users', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/users`, { params: req.query })
        res.json(response.data)
    } catch(e) {
        res.json(botData.users)
    }
})

app.get('/api/search/:query', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/search/${req.params.query}`)
        res.json(response.data)
    } catch(e) {
        res.json([])
    }
})

app.get('/api/system', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/system`)
        res.json(response.data)
    } catch(e) {
        res.json(botData.system)
    }
})

// WebSocket untuk client web
io.on('connection', (socket) => {
    console.log('📱 Web client connected')
    
    // Kirim data terbaru
    socket.emit('botUpdate', botData)
    
    socket.on('disconnect', () => {
        console.log('📱 Web client disconnected')
    })
})

// Start server
server.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║   WhatsApp Bot Dashboard Started     ║
    ╠══════════════════════════════════════╣
    ║  URL: http://localhost:${PORT}        ║
    ║  Bot API: ${BOT_API_URL}              ║
    ║  Status: Waiting for bot connection  ║
    ╚══════════════════════════════════════╝
    `)
    
    // Connect ke bot
    connectToBot()
})
