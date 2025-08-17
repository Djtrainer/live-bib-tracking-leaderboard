/**
 * Live Race Results - JavaScript Controller
 * 
 * This script handles two modes:
 * 1. Local Test Mode (default) - Uses mock data generator for testing
 * 2. Live Mode (commented out) - Connects to WebSocket for real-time data
 */

class RaceLeaderboard {
    constructor() {
        this.finishers = [];
        this.leaderboardBody = document.getElementById('leaderboardBody');
        this.emptyState = document.getElementById('emptyState');
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the leaderboard application
     */
    init() {
        console.log('🏁 Race Leaderboard initialized');
        
        // Start in local test mode by default
        this.startLocalTestMode();
        
        // Uncomment the line below and comment out the line above to use live mode
        // this.startLiveMode();
    }

    /**
     * LOCAL TEST MODE
     * Generates mock race data for testing purposes
     */
    startLocalTestMode() {
        console.log('📊 Starting Local Test Mode');
        
        // Mock data configuration
        const mockConfig = {
            interval: 3000, // New finisher every 3 seconds
            bibNumbers: this.generateBibNumbers(50), // Generate 50 random bib numbers
            baseTime: 300000, // Base time: 5 minutes in milliseconds
            timeVariation: 120000 // ±2 minutes variation
        };

        let finisherIndex = 0;

        // Generate a new finisher every few seconds
        const mockInterval = setInterval(() => {
            if (finisherIndex >= mockConfig.bibNumbers.length) {
                console.log('🏁 All mock finishers have completed the race');
                clearInterval(mockInterval);
                return;
            }

            // Generate mock finisher data
            const mockFinisher = {
                bibNumber: mockConfig.bibNumbers[finisherIndex],
                finishTimeMs: mockConfig.baseTime + 
                             (Math.random() * mockConfig.timeVariation * 2) - 
                             mockConfig.timeVariation + 
                             (finisherIndex * 5000) // Each finisher is slightly slower
            };

            console.log(`🏃 New finisher: Bib #${mockFinisher.bibNumber}, Time: ${this.formatTime(mockFinisher.finishTimeMs)}`);
            
            // Add the finisher to the leaderboard
            this.addFinisher(mockFinisher);
            finisherIndex++;
        }, mockConfig.interval);
    }

    /**
     * Generate random bib numbers for testing
     */
    generateBibNumbers(count) {
        const bibNumbers = [];
        const usedNumbers = new Set();
        
        while (bibNumbers.length < count) {
            const bibNumber = Math.floor(Math.random() * 9999) + 1;
            if (!usedNumbers.has(bibNumber)) {
                usedNumbers.add(bibNumber);
                bibNumbers.push(bibNumber);
            }
        }
        
        return bibNumbers.sort((a, b) => a - b);
    }

    /**
     * LIVE MODE (COMMENTED OUT)
     * Connect to WebSocket for real-time race data
     */
    /*
    startLiveMode() {
        console.log('🔴 Starting Live Mode');
        
        // WebSocket configuration
        const WEBSOCKET_URL = 'wss://your-websocket-endpoint.com/race-updates';
        
        try {
            // Create WebSocket connection
            this.websocket = new WebSocket(WEBSOCKET_URL);
            
            // Connection opened
            this.websocket.onopen = (event) => {
                console.log('✅ WebSocket connected successfully');
                this.updateConnectionStatus(true);
            };
            
            // Listen for messages
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 Received race data:', data);
                    
                    // Validate the incoming data
                    if (this.validateFinisherData(data)) {
                        this.addFinisher(data);
                    } else {
                        console.error('❌ Invalid finisher data received:', data);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };
            
            // Handle connection errors
            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus(false);
            };
            
            // Handle connection close
            this.websocket.onclose = (event) => {
                console.log('🔌 WebSocket connection closed');
                this.updateConnectionStatus(false);
                
                // Attempt to reconnect after 5 seconds
                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    this.startLiveMode();
                }, 5000);
            };
            
        } catch (error) {
            console.error('❌ Failed to establish WebSocket connection:', error);
            this.updateConnectionStatus(false);
        }
    }
    */

    /**
     * Validate incoming finisher data
     */
    validateFinisherData(data) {
        return data && 
               typeof data.bibNumber !== 'undefined' && 
               typeof data.finishTimeMs === 'number' &&
               data.finishTimeMs > 0;
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (isConnected) {
            statusDot.style.backgroundColor = '#00ff88';
            statusText.textContent = 'Status: Live';
        } else {
            statusDot.style.backgroundColor = '#ff4444';
            statusText.textContent = 'Status: Disconnected';
        }
    }

    /**
     * Add a new finisher to the leaderboard
     */
    addFinisher(finisherData) {
        // Add to finishers array
        this.finishers.push({
            bibNumber: finisherData.bibNumber,
            finishTimeMs: finisherData.finishTimeMs,
            rank: this.finishers.length + 1
        });

        // Sort finishers by finish time (fastest first)
        this.finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);

        // Update ranks after sorting
        this.finishers.forEach((finisher, index) => {
            finisher.rank = index + 1;
        });

        // Re-render the entire table to maintain proper ranking
        this.renderLeaderboard();

        // Hide empty state if it's visible
        if (!this.emptyState.classList.contains('hidden')) {
            this.emptyState.classList.add('hidden');
        }
    }

    /**
     * Render the complete leaderboard
     */
    renderLeaderboard() {
        // Clear existing content
        this.leaderboardBody.innerHTML = '';

        // Add each finisher to the table
        this.finishers.forEach((finisher, index) => {
            const row = this.createFinisherRow(finisher, index === this.finishers.length - 1);
            this.leaderboardBody.appendChild(row);
        });
    }

    /**
     * Create a table row for a finisher
     */
    createFinisherRow(finisher, isNewEntry = false) {
        const row = document.createElement('tr');
        
        // Add animation class for new entries
        if (isNewEntry) {
            row.classList.add('new-entry');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                row.classList.remove('new-entry');
            }, 1500);
        }

        // Create table cells
        const rankCell = document.createElement('td');
        rankCell.textContent = finisher.rank;

        const bibCell = document.createElement('td');
        bibCell.textContent = `#${finisher.bibNumber}`;

        const timeCell = document.createElement('td');
        timeCell.textContent = this.formatTime(finisher.finishTimeMs);

        // Append cells to row
        row.appendChild(rankCell);
        row.appendChild(bibCell);
        row.appendChild(timeCell);

        return row;
    }

    /**
     * Format time from milliseconds to MM:SS.ms format
     * Example: 321350ms -> "05:21.35"
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10); // Get centiseconds

        // Format with leading zeros
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        const formattedMs = ms.toString().padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
    }

    /**
     * Get current leaderboard data (useful for debugging)
     */
    getLeaderboardData() {
        return this.finishers;
    }

    /**
     * Clear all finishers (useful for testing)
     */
    clearLeaderboard() {
        this.finishers = [];
        this.leaderboardBody.innerHTML = '';
        this.emptyState.classList.remove('hidden');
        console.log('🧹 Leaderboard cleared');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance for debugging purposes
    window.raceLeaderboard = new RaceLeaderboard();
});

/**
 * DEBUGGING UTILITIES
 * These functions are available in the browser console for testing
 */

// Add a manual finisher (useful for testing)
window.addTestFinisher = (bibNumber, timeInSeconds) => {
    if (window.raceLeaderboard) {
        const finisher = {
            bibNumber: bibNumber || Math.floor(Math.random() * 9999) + 1,
            finishTimeMs: (timeInSeconds || Math.random() * 600 + 300) * 1000
        };
        window.raceLeaderboard.addFinisher(finisher);
        console.log('✅ Test finisher added:', finisher);
    }
};

// Clear the leaderboard (useful for testing)
window.clearLeaderboard = () => {
    if (window.raceLeaderboard) {
        window.raceLeaderboard.clearLeaderboard();
    }
};

// Get current leaderboard data
window.getLeaderboard = () => {
    if (window.raceLeaderboard) {
        return window.raceLeaderboard.getLeaderboardData();
    }
    return [];
};
