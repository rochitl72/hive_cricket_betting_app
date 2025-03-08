import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [user, setUser] = useState(null);
    const [loginURL, setLoginURL] = useState('');
    const [matchId, setMatchId] = useState('');
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);

    // Fetch Login URL and Leaderboard Data
    useEffect(() => {
        axios.get('http://localhost:5000/auth')
            .then(response => setLoginURL(response.data.loginURL))
            .catch(error => console.error('❌ Error getting login URL:', error));

        const params = new URLSearchParams(window.location.search);
        const username = params.get('username');
        const accessToken = params.get('access_token');

        if (username && accessToken) {
            setUser(username);
            localStorage.setItem('hive_user', username);
            localStorage.setItem('hive_token', accessToken);
        }

        axios.get('http://localhost:5000/leaderboard')
            .then(response => setLeaderboard(response.data))
            .catch(error => console.error('❌ Error fetching leaderboard:', error));
    }, []);

    // Handle Hive Login
    const handleLogin = () => {
        window.location.href = loginURL;
    };

    // Handle Hive Keychain Staking
    const handleStake = () => {
        if (!window.hive_keychain) {
            setMessage('❌ Hive Keychain is not installed!');
            return;
        }

        if (!matchId || !amount) {
            setMessage('❌ Please enter Match ID and Amount!');
            return;
        }

        window.hive_keychain.requestTransfer(
            user,
            "rochitlen",  // Hive account receiving stakes
            parseFloat(amount).toFixed(3), 
            `Staking ${amount} HIVE on Match ${matchId}`, 
            "HIVE", 
            (response) => {
                if (response.success) {
                    setMessage("✅ Stake successful!");

                    // Notify Backend to Store Stake
                    axios.post('http://localhost:5000/stake', {
                        username: user,
                        matchId,
                        amount,
                        access_token: localStorage.getItem('hive_token')
                    }).then(() => {
                        axios.get('http://localhost:5000/leaderboard')
                            .then(response => setLeaderboard(response.data));
                    });

                } else {
                    setMessage("❌ Transaction failed!");
                }
            }
        );
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>🐝 HiveCricket</h1>
            {user ? (
                <>
                    <h2>Welcome, {user}!</h2>
                    <h3>⚾ Stake HIVE on Match Predictions</h3>
                    <input 
                        type="text" 
                        placeholder="Enter Match ID"
                        value={matchId}
                        onChange={(e) => setMatchId(e.target.value)}
                    />
                    <input 
                        type="number" 
                        placeholder="Enter HIVE Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <button onClick={handleStake} style={{ marginLeft: '10px', padding: '10px', backgroundColor: 'green', color: 'white', border: 'none' }}>
                        Stake Now
                    </button>
                    <p>{message}</p>

                    <h2>🏆 Leaderboard</h2>
                    <ul>
                        {leaderboard.map((entry, index) => (
                            <li key={index}>
                                {index + 1}. {entry.username} - {entry.totalStake} HIVE
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <button onClick={handleLogin} style={{ padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none' }}>
                    Login with Hive
                </button>
            )}
        </div>
    );
}

export default App;
