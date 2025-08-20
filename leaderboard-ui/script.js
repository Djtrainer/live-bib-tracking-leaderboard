// Google Gemini Style Leaderboard - JavaScript Controller
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const resultsBody = document.getElementById('resultsBody');
    const resultsTable = document.getElementById('resultsTable');
    const tableContainer = document.getElementById('tableContainer');
    const emptyState = document.getElementById('emptyState');
    const statusChip = document.getElementById('statusChip');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Stats elements
    const totalFinishersEl = document.getElementById('totalFinishers');
    const leadTimeEl = document.getElementById('leadTime');
    const lastUpdatedEl = document.getElementById('lastUpdated');

    let finishers = [];

    // Initialize the application
    function init() {
        console.log('🏃‍♂️ Gemini Leaderboard initializing...');
        
        // Set initial status
        updateConnectionStatus('connecting');
        
        // Initialize stats
        updateStats();
        
        // Start the process
        fetchInitialResults();
        connectWebSocket();
        
        console.log('✅ Gemini Leaderboard initialized');
    }

    // Fetch initial results from API
    async function fetchInitialResults() {
        try {
            showLoadingIndicator(true);
            const response = await fetch('http://localhost:8000/api/results');
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                finishers = result.data;
                renderLeaderboard();
                updateStats();
                updateLastUpdated();
            }
        } catch (error) {
            console.error("Could not fetch initial results:", error);
            updateConnectionStatus('disconnected');
        } finally {
            showLoadingIndicator(false);
        }
    }

    // Connect to WebSocket for live updates
    function connectWebSocket() {
        const WEBSOCKET_URL = 'ws://localhost:8000/ws';
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('Leaderboard connected to WebSocket.');
            updateConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
            const messageData = JSON.parse(event.data);
            console.log('Received message:', messageData);
            
            showLoadingIndicator(true);
            
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
                renderLeaderboard(true); // Mark as new entry for animation
            }
            
            updateStats();
            updateLastUpdated();
            
            setTimeout(() => showLoadingIndicator(false), 300);
        };

        ws.onclose = () => {
            console.log('Leaderboard WebSocket disconnected. Retrying...');
            updateConnectionStatus('disconnected');
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            updateConnectionStatus('disconnected');
            ws.close();
        };
    }

    // Render the leaderboard table
    function renderLeaderboard(isNewEntry = false) {
        // Sort by finish time
        finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
        
        if (finishers.length === 0) {
            showEmptyState();
            return;
        }
        
        hideEmptyState();
        resultsBody.innerHTML = ''; // Clear the table
        
        finishers.forEach((finisher, index) => {
            const rank = index + 1;
            const time = formatTime(finisher.finishTimeMs);
            const racerName = finisher.racerName || 'Unknown Racer';
            
            const row = document.createElement('tr');
            
            // Add new entry animation class if this is a new entry
            if (isNewEntry && index === finishers.length - 1) {
                row.classList.add('new-entry');
            }
            
            row.innerHTML = `
                <td>${rank}</td>
                <td>#${finisher.bibNumber}</td>
                <td>${racerName}</td>
                <td>${time}</td>
            `;
            
            resultsBody.appendChild(row);
        });
    }

    // Update connection status
    function updateConnectionStatus(status) {
        statusChip.className = 'status-chip';
        
        switch (status) {
            case 'connected':
                statusChip.classList.add('connected');
                statusIcon.textContent = 'wifi';
                statusText.textContent = 'Live';
                break;
            case 'disconnected':
                statusIcon.textContent = 'wifi_off';
                statusText.textContent = 'Disconnected';
                break;
            case 'connecting':
            default:
                statusIcon.textContent = 'sync';
                statusText.textContent = 'Connecting...';
                break;
        }
    }

    // Show/hide empty state
    function showEmptyState() {
        emptyState.classList.remove('hidden');
        tableContainer.classList.remove('visible');
    }

    function hideEmptyState() {
        emptyState.classList.add('hidden');
        tableContainer.classList.add('visible');
    }

    // Show/hide loading indicator
    function showLoadingIndicator(show) {
        if (show) {
            loadingIndicator.classList.add('active');
        } else {
            loadingIndicator.classList.remove('active');
        }
    }

    // Update statistics
    function updateStats() {
        // Total finishers
        totalFinishersEl.textContent = finishers.length;
        
        // Leading time (fastest time)
        if (finishers.length > 0) {
            const sortedFinishers = [...finishers].sort((a, b) => a.finishTimeMs - b.finishTimeMs);
            leadTimeEl.textContent = formatTime(sortedFinishers[0].finishTimeMs);
        } else {
            leadTimeEl.textContent = '--:--';
        }
    }

    // Update last updated time
    function updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        lastUpdatedEl.textContent = timeString;
    }

    // Format time helper
    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    // Start the application
    init();
});
