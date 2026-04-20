// api/register.js
// Endpoint untuk registrasi user dari website

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    // GET - tampilkan form registrasi (optional)
    if (req.method === 'GET') {
        return res.status(200).json({
            message: 'Register endpoint is ready',
            fields: ['number', 'name', 'age']
        })
    }
    
    // POST - proses registrasi
    if (req.method === 'POST') {
        try {
            const { number, name, age, referrer } = req.body
            
            // Validasi input
            if (!number) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nomor WhatsApp wajib diisi!' 
                })
            }
            
            if (!name) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Nama wajib diisi!' 
                })
            }
            
            // Clean nomor
            let cleanNumber = number.toString().replace(/[^0-9]/g, '')
            if (cleanNumber.startsWith('0')) {
                cleanNumber = '62' + cleanNumber.substring(1)
            }
            if (!cleanNumber.startsWith('62')) {
                cleanNumber = '62' + cleanNumber
            }
            
            const userJid = cleanNumber + '@s.whatsapp.net'
            
            // Simpan ke database (via bot API)
            const botApiUrl = process.env.BOT_API_URL || 'http://localhost:5000'
            const apiKey = process.env.API_KEY
            
            const response = await fetch(`${botApiUrl}/api/register-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    jid: userJid,
                    number: cleanNumber,
                    name: name,
                    age: age || 0,
                    referrer: referrer || null,
                    registeredAt: new Date().toISOString()
                })
            })
            
            const result = await response.json()
            
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Registrasi berhasil!',
                    user: {
                        number: cleanNumber,
                        name: name,
                        registeredAt: new Date().toISOString()
                    }
                })
            } else {
                return res.status(400).json({
                    success: false,
                    error: result.error || 'Gagal registrasi'
                })
            }
            
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
