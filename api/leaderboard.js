// api/leaderboard.js
// Leaderboard specific endpoint

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }
    
    const { type, limit = 20 } = req.query
    
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'https'
        const host = req.headers['host']
        const baseUrl = `${protocol}://${host}`
        
        const response = await fetch(`${baseUrl}/api/bot-data`)
        const data = await response.json()
        
        let leaderboard = []
        let title = ''
        
        switch(type) {
            case 'exp':
                leaderboard = data.leaderboard?.exp || []
                title = 'EXP Leaderboard'
                break
            case 'money':
                leaderboard = data.leaderboard?.money || []
                title = 'Money Leaderboard'
                break
            case 'level':
                leaderboard = data.leaderboard?.level || []
                title = 'Level Leaderboard'
                break
            case 'limit':
                leaderboard = data.leaderboard?.limit || []
                title = 'Limit Leaderboard'
                break
            default:
                leaderboard = data.leaderboard?.exp || []
                title = 'EXP Leaderboard'
        }
        
        res.status(200).json({
            success: true,
            title: title,
            data: leaderboard.slice(0, parseInt(limit)),
            total: leaderboard.length,
            lastUpdate: data.lastUpdate
        })
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        })
    }
}
