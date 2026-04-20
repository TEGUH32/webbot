// api/register.js
// Endpoint untuk registrasi dari website

// Database registrasi sementara (akan diambil oleh bot)
let pendingRegistrations = []

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // GET - ambil pending registrations (untuk bot)
    if (req.method === 'GET') {
        const registrations = [...pendingRegistrations]
        // Kosongkan setelah diambil
        pendingRegistrations = []
        return res.status(200).json({
            success: true,
            registrations: registrations
        })
    }
    
    // POST - daftar baru dari website
    if (req.method === 'POST') {
        try {
            const { number, name, age } = req.body
            
            if (!number || !name) {
                return res.status(400).json({
                    success: false,
                    error: 'Nomor dan nama wajib diisi!'
                })
            }
            
            // Clean number
            let cleanNumber = number.toString().replace(/[^0-9]/g, '')
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.substring(1)
            }
            if (!cleanNumber.startsWith('62')) {
                cleanNumber = '62' + cleanNumber
            }
            
            // Simpan ke pending registrations
            const newRegistration = {
                number: cleanNumber,
                name: name,
                age: age || 0,
                registeredAt: new Date().toISOString(),
                status: 'pending'
            }
            
            pendingRegistrations.push(newRegistration)
            
            console.log(`📝 New registration from website: ${name} (${cleanNumber})`)
            
            return res.status(200).json({
                success: true,
                message: 'Registrasi berhasil! Bot akan mengirim konfirmasi ke WhatsApp Anda dalam beberapa saat.',
                user: {
                    number: cleanNumber,
                    name: name
                }
            })
            
        } catch (error) {
            console.error('Register error:', error)
            return res.status(500).json({
                success: false,
                error: error.message
            })
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' })
}
