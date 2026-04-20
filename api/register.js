// api/register.js
// User registration endpoint

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            message: 'Registration endpoint is ready',
            instructions: {
                method: 'POST',
                body: {
                    number: '6281234567890',
                    name: 'Nama User',
                    age: 20
                }
            }
        })
    }
    
    if (req.method === 'POST') {
        try {
            const { number, name, age, referrer } = req.body
            
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
            
            // Forward ke bot API
            const botApiUrl = process.env.BOT_API_URL
            const apiKey = process.env.API_KEY
            
            if (botApiUrl && apiKey) {
                const response = await fetch(`${botApiUrl}/api/register-user`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey
                    },
                    body: JSON.stringify({
                        jid: cleanNumber + '@s.whatsapp.net',
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
            }
            
            // Fallback response jika bot API tidak tersedia
            return res.status(200).json({
                success: true,
                message: 'Registrasi dicatat (offline mode)',
                user: { number: cleanNumber, name: name }
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
