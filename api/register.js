// api/register.js
// Registration endpoint with persistent storage

import fs from 'fs'
import path from 'path'

const PENDING_FILE = path.join(process.cwd(), 'tmp', 'pending-registrations.json')

function getPendingRegistrations() {
    try {
        if (fs.existsSync(PENDING_FILE)) {
            const data = fs.readFileSync(PENDING_FILE, 'utf8')
            return JSON.parse(data)
        }
    } catch (e) {}
    return []
}

function savePendingRegistrations(registrations) {
    try {
        const dir = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(PENDING_FILE, JSON.stringify(registrations, null, 2))
    } catch (e) {}
}

function addPendingRegistration(reg) {
    const registrations = getPendingRegistrations()
    registrations.push({
        ...reg,
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        createdAt: new Date().toISOString()
    })
    savePendingRegistrations(registrations)
    return registrations
}

function getAndClearPendingRegistrations() {
    const registrations = getPendingRegistrations()
    const pending = registrations.filter(r => r.status === 'pending')
    const updated = registrations.map(r => {
        if (r.status === 'pending') {
            return { ...r, status: 'processing', processedAt: new Date().toISOString() }
        }
        return r
    })
    savePendingRegistrations(updated)
    return pending
}

function markRegistrationCompleted(id) {
    let registrations = getPendingRegistrations()
    registrations = registrations.filter(r => r.id !== id)
    savePendingRegistrations(registrations)
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // GET - untuk bot mengambil pending registrations
    if (req.method === 'GET') {
        const { action, number, id } = req.query
        
        if (action === 'fetch') {
            const pending = getAndClearPendingRegistrations()
            console.log(`[REGISTER] Bot fetched ${pending.length} pending registrations`)
            return res.status(200).json({
                success: true,
                registrations: pending,
                count: pending.length
            })
        }
        
        if (action === 'check' && number) {
            const registrations = getPendingRegistrations()
            const userReg = registrations.find(r => r.number === number)
            return res.status(200).json({
                success: true,
                registered: userReg ? userReg.status === 'completed' : false,
                status: userReg ? userReg.status : null
            })
        }
        
        if (action === 'complete' && id) {
            markRegistrationCompleted(id)
            return res.status(200).json({ success: true })
        }
        
        return res.status(200).json({
            success: true,
            pending: getPendingRegistrations().filter(r => r.status === 'pending').length,
            processing: getPendingRegistrations().filter(r => r.status === 'processing').length
        })
    }
    
    // POST - registrasi dari website
    if (req.method === 'POST') {
        try {
            const { number, name, age } = req.body
            
            console.log(`[REGISTER] New registration request: ${name} (${number})`)
            
            if (!number || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Nomor dan nama wajib diisi!'
                })
            }
            
            let cleanNumber = number.toString().replace(/[^0-9]/g, '')
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.substring(1)
            }
            if (!cleanNumber.startsWith('62')) {
                cleanNumber = '62' + cleanNumber
            }
            
            const existing = getPendingRegistrations().find(r => r.number === cleanNumber && r.status !== 'completed')
            if (existing) {
                return res.status(200).json({
                    success: true,
                    message: 'Pendaftaran sudah diproses. Bot akan mengirim konfirmasi ke WhatsApp Anda.',
                    user: { number: cleanNumber, name: name }
                })
            }
            
            addPendingRegistration({
                number: cleanNumber,
                name: name,
                age: age || 0,
                registeredAt: new Date().toISOString(),
                status: 'pending'
            })
            
            console.log(`[REGISTER] Registration saved: ${name} (${cleanNumber})`)
            
            return res.status(200).json({
                success: true,
                message: 'Registrasi berhasil! Bot akan mengirim konfirmasi ke WhatsApp Anda dalam beberapa saat.',
                user: { number: cleanNumber, name: name }
            })
            
        } catch (error) {
            console.error('[REGISTER] Error:', error)
            return res.status(500).json({
                success: false,
                error: error.message
            })
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
