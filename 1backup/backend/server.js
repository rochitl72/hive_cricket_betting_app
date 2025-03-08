require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const hivesigner = require('hivesigner');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new hivesigner.Client({
    app: "rochitlen", // Replace with your Hive app name
    callbackURL: "http://localhost:5000/callback",
    scope: ["login"]
});

// Store staked data (temporary storage, replace with a database later)
let stakes = [];

app.post('/stake', async (req, res) => {
    const { username, matchId, amount, access_token } = req.body;

    if (!username || !matchId || !amount || !access_token) {
        return res.status(400).json({ error: '❌ Missing required fields' });
    }

    try {
        // Store staking data
        stakes.push({ username, matchId, amount: parseFloat(amount) });

        console.log(`✅ User ${username} staked ${amount} HIVE on match ${matchId}`);

        res.json({ success: true, message: 'Stake successful!', username, matchId, amount });
    } catch (error) {
        res.status(500).json({ error: '❌ Transaction failed' });
    }
});


// Default Route
app.get('/', (req, res) => {
    res.json({ message: '✅ HiveCricket Backend is Running! Use /auth to login.' });
});

// Generate Hive Login URL
app.get('/auth', (req, res) => {
    const loginURL = client.getLoginURL();
    res.json({ loginURL });
});

// Handle HiveSigner Authentication
app.get('/callback', async (req, res) => {
    const { access_token } = req.query;
    
    if (!access_token) {
        return res.status(400).json({ error: '❌ No access token provided!' });
    }

    try {
        // Fetch user details
        const userDataResponse = await fetch(`https://hivesigner.com/api/me`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const userData = await userDataResponse.json();

        if (userData.error) {
            return res.status(500).json({ error: '❌ Failed to retrieve user data' });
        }

        // Redirect back to frontend with user data
        res.redirect(`http://localhost:3000/auth-success?username=${userData.account.name}&access_token=${access_token}`);
    } catch (error) {
        res.status(500).json({ error: '❌ Authentication failed' });
    }
});


app.post('/stake', async (req, res) => {
    const { username, matchId, amount, access_token } = req.body;

    if (!username || !matchId || !amount || !access_token) {
        return res.status(400).json({ error: '❌ Missing required fields' });
    }

    try {
        // Simulate Hive transaction (Replace with real Hive broadcast API later)
        console.log(`✅ User ${username} staked ${amount} HIVE on match ${matchId}`);

        // Return success response
        res.json({ success: true, message: 'Stake successful!', username, matchId, amount });
    } catch (error) {
        res.status(500).json({ error: '❌ Transaction failed' });
    }
});
app.get('/leaderboard', (req, res) => {
    // Aggregate stakes by user
    const leaderboard = stakes.reduce((acc, stake) => {
        const existingUser = acc.find(entry => entry.username === stake.username);
        if (existingUser) {
            existingUser.totalStake += stake.amount;
        } else {
            acc.push({ username: stake.username, totalStake: stake.amount });
        }
        return acc;
    }, []);

    // Sort leaderboard by highest stake
    leaderboard.sort((a, b) => b.totalStake - a.totalStake);

    res.json(leaderboard);
});



// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
