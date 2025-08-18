// leaderboard-ui/script.js
document.addEventListener('DOMContentLoaded', () => {
    const leaderboardBody = document.getElementById('leaderboardBody');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');

    let finishers = [];

    // --- 1. Fetch the initial state of the leaderboard ---
    async function fetchInitialResults() {
        try {
            const response = await fetch('http://localhost:8000/api/results');
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                finishers = result.data;
                renderLeaderboard();
            }
        } catch (error) {
            console.error("Could not fetch initial results:", error);
        }
    }

    // --- 2. Connect to the WebSocket for live updates ---
    function connectWebSocket() {
        const WEBSOCKET_URL = 'ws://localhost:8000/ws';
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('Leaderboard connected to WebSocket.');
            statusDot.style.backgroundColor = '#00ff88';
            statusText.textContent = 'Status: Live';
        };

        ws.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            console.log('Received message:', messageData);
            
            // Handle different message types from admin updates
            if (messageData.type === 'update') {
                // Handle finisher update from admin
                const finisherData = messageData.data;
                const existingIndex = finishers.findIndex(f => f.id === finisherData.id);
                if (existingIndex > -1) {
                    finishers[existingIndex] = finisherData;
                } else {
                    finishers.push(finisherData);
                }
                renderLeaderboard();
            } else if (messageData.type === 'delete') {
                // Handle finisher deletion from admin
                const finisherId = messageData.id;
                const existingIndex = finishers.findIndex(f => f.id === finisherId);
                if (existingIndex > -1) {
                    finishers.splice(existingIndex, 1);
                    renderLeaderboard();
                }
            } else if (messageData.type === 'reorder') {
                // Handle reorder from admin - replace all data
                finishers = messageData.data;
                renderLeaderboard();
            } else {
                // Handle simple finisher addition (backward compatibility)
                const finisherData = messageData;
                // For new additions, try to match by id first, then bibNumber
                let existingIndex = finishers.findIndex(f => f.id === finisherData.id);
                if (existingIndex === -1) {
                    existingIndex = finishers.findIndex(f => f.bibNumber === finisherData.bibNumber);
                }
                if (existingIndex > -1) {
                    finishers[existingIndex] = finisherData;
                } else {
                    finishers.push(finisherData);
                }
                renderLeaderboard();
            }
        };

        ws.onclose = () => {
            console.log('Leaderboard WebSocket disconnected. Retrying...');
            statusDot.style.backgroundColor = '#ff4444';
            statusText.textContent = 'Status: Disconnected';
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            ws.close();
        };
    }

    // --- 3. Helper function to render the table ---
    function renderLeaderboard() {
        // Sort by finish time
        finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
        
        leaderboardBody.innerHTML = ''; // Clear the table
        
        finishers.forEach((finisher, index) => {
            const rank = index + 1;
            const time = formatTime(finisher.finishTimeMs);
            const racerName = finisher.racerName || 'Unknown Racer';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rank}</td>
                <td>#${finisher.bibNumber}</td>
                <td>${racerName}</td>
                <td>${time}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    // --- 4. Start the process ---
    fetchInitialResults();
    connectWebSocket();
});
