/**
 * Race Admin Dashboard - JavaScript Controller (Google Gemini Style)
 * 
 * This script handles:
 * 1. Authentication and login gate
 * 2. CRUD operations for race results
 * 3. API communication with backend
 * 4. Real-time UI updates
 * 5. Material Design interactions
 */

class RaceAdminDashboard {
    constructor() {
        // Configuration
        this.config = {
            // For local testing - change this to your actual password
            adminPassword: 'admin123',
            
            // API endpoints - update these to match your backend
            apiBaseUrl: 'http://localhost:8000',
            endpoints: {
                results: '/api/results',
                reorder: '/api/reorder'
            },
            
            // UI settings
            toastDuration: 4000,
            apiTimeout: 10000
        };

        // State management
        this.state = {
            isAuthenticated: false,
            finishers: [],
            isLoading: false,
            editingRowId: null,
            addFormVisible: false
        };

        // DOM elements
        this.elements = {
            // Login elements
            loginContainer: document.getElementById('loginContainer'),
            adminContainer: document.getElementById('adminContainer'),
            loginForm: document.getElementById('loginForm'),
            passwordInput: document.getElementById('password'),
            loginError: document.getElementById('loginError'),
            
            // Header elements
            statusIcon: document.getElementById('statusIcon'),
            statusText: document.getElementById('statusText'),
            refreshBtn: document.getElementById('refreshBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            addFinisherBtn: document.getElementById('addFinisherBtn'),
            
            // Form elements
            formCard: document.getElementById('formCard'),
            closeFormBtn: document.getElementById('closeFormBtn'),
            addFinisherForm: document.getElementById('addFinisherForm'),
            bibNumberInput: document.getElementById('bibNumber'),
            racerNameInput: document.getElementById('racerName'),
            finishTimeInput: document.getElementById('finishTime'),
            cancelBtn: document.getElementById('cancelBtn'),
            
            // Table elements
            recordCount: document.getElementById('recordCount'),
            tableContainer: document.getElementById('tableContainer'),
            tableBody: document.getElementById('tableBody'),
            emptyState: document.getElementById('emptyState'),
            loadingState: document.getElementById('loadingState'),
            
            // Modal elements
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            confirmBtn: document.getElementById('confirmBtn'),
            modalCancelBtn: document.getElementById('modalCancelBtn'),
            modalCloseBtn: document.getElementById('modalCloseBtn'),
            
            // Toast container
            toastContainer: document.getElementById('toastContainer')
        };

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the admin dashboard
     */
    init() {
        console.log('🔧 Race Admin Dashboard initializing...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if already authenticated (for development)
        this.checkAuthStatus();
        
        console.log('✅ Admin Dashboard initialized');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Login form
        this.elements.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout button
        this.elements.logoutBtn?.addEventListener('click', () => this.handleLogout());
        
        // Refresh button
        this.elements.refreshBtn?.addEventListener('click', () => this.loadFinishers());
        
        // Add finisher button
        this.elements.addFinisherBtn?.addEventListener('click', () => this.showAddForm());
        this.elements.closeFormBtn?.addEventListener('click', () => this.hideAddForm());
        this.elements.cancelBtn?.addEventListener('click', () => this.hideAddForm());
        
        // Add finisher form
        this.elements.addFinisherForm?.addEventListener('submit', (e) => this.handleAddFinisher(e));
        
        // Modal buttons
        this.elements.modalCancelBtn?.addEventListener('click', () => this.hideModal());
        this.elements.modalCloseBtn?.addEventListener('click', () => this.hideModal());
        this.elements.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.hideModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                this.hideAddForm();
            }
        });
    }

    /**
     * Check authentication status
     */
    checkAuthStatus() {
        // For development, you might want to skip login
        // Uncomment the line below to bypass login for testing
        // this.authenticateUser();
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const password = this.elements.passwordInput.value.trim();
        const loginBtn = event.target.querySelector('button[type="submit"]');
        
        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="material-symbols-outlined loading-spinner">progress_activity</span> Signing in...';
        this.elements.loginError?.classList.add('hidden');
        
        try {
            // Simulate API call delay for realistic UX
            await this.delay(1000);
            
            // For local testing, check against hardcoded password
            // In production, this should be an API call to your authentication endpoint
            if (password === this.config.adminPassword) {
                this.authenticateUser();
            } else {
                throw new Error('Invalid password');
            }
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.elements.loginError?.classList.remove('hidden');
            this.elements.passwordInput.focus();
            this.elements.passwordInput.select();
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span class="btn-text">Access Dashboard</span><span class="material-symbols-outlined btn-spinner">sync</span>';
        }
    }

    /**
     * Authenticate user and show admin interface
     */
    async authenticateUser() {
        console.log('✅ User authenticated');
        
        this.state.isAuthenticated = true;
        
        // Hide login, show admin interface
        this.elements.loginContainer?.classList.add('hidden');
        this.elements.adminContainer?.classList.remove('hidden');
        
        // Update connection status
        this.updateConnectionStatus('connecting');
        
        // Load the initial state of the leaderboard from your API
        await this.loadFinishers();

        // Start listening for live updates from the public WebSocket feed
        this.startRealTimeSync();
    }

    /**
     * Handle logout
     */
    handleLogout() {
        console.log('🚪 User logged out');
        
        this.state.isAuthenticated = false;
        this.state.finishers = [];
        
        // Reset forms
        this.elements.loginForm?.reset();
        this.elements.addFinisherForm?.reset();
        this.hideAddForm();
        this.hideModal();
        
        // Show login, hide admin interface
        this.elements.adminContainer?.classList.add('hidden');
        this.elements.loginContainer?.classList.remove('hidden');
        
        // Focus password input
        this.elements.passwordInput?.focus();
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const dot = this.elements.statusDot;
        const statusText = this.elements.connectionStatus?.querySelector('span:last-child');
        
        if (!dot || !statusText) return;
        
        // Remove all status classes
        dot.classList.remove('connected');
        
        switch (status) {
            case 'connected':
                dot.classList.add('connected');
                statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                break;
            case 'connecting':
            default:
                statusText.textContent = 'Connecting...';
                break;
        }
    }

    /**
     * CRUD OPERATIONS
     */

    /**
     * Load all finishers from the API
     */
    async loadFinishers() {
        console.log('📊 Loading finishers...');
        
        this.showLoadingState();
        
        try {
            // API call to fetch all results
            const response = await this.apiCall('GET', this.config.endpoints.results);
            
            if (response.success) {
                this.state.finishers = response.data || [];
                this.updateConnectionStatus('connected');
                this.renderFinishers();
                
                console.log(`✅ Loaded ${this.state.finishers.length} finishers`);
                this.showToast('success', `Loaded ${this.state.finishers.length} finishers`, 'check_circle');
            } else {
                throw new Error(response.message || 'Failed to load finishers');
            }
            
        } catch (error) {
            console.error('❌ Failed to load finishers:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('error', 'Failed to load race data', 'error');
            this.showEmptyState();
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Add a new finisher
     */
    async handleAddFinisher(event) {
        event.preventDefault();
        
        const finisherData = {
            bibNumber: parseInt(this.elements.bibNumberInput.value),
            racerName: this.elements.racerNameInput.value.trim(),
            finishTime: this.elements.finishTimeInput.value.trim()
        };

        // Validate the data
        if (!this.validateFinisherData(finisherData)) {
            return;
        }

        // Convert time to milliseconds for API
        const finishTimeMs = this.timeStringToMilliseconds(finisherData.finishTime);
        if (finishTimeMs === null) {
            this.showToast('error', 'Invalid time format. Use MM:SS.ms', 'warning');
            return;
        }

        const apiData = {
            ...finisherData,
            finishTimeMs: finishTimeMs
        };

        const addBtn = event.target.querySelector('button[type="submit"]');
        const originalContent = addBtn.innerHTML;
        addBtn.disabled = true;
        addBtn.innerHTML = '<span class="material-symbols-outlined loading-spinner">progress_activity</span> Adding...';

        try {
            // API call to add new finisher
            const response = await this.apiCall('POST', this.config.endpoints.results, apiData);
            
            if (response.success) {
                console.log('✅ Finisher added successfully');
                this.showToast('success', `Added ${finisherData.racerName} (#${finisherData.bibNumber})`, 'check_circle');
                
                // Reset form and hide it
                this.elements.addFinisherForm.reset();
                this.hideAddForm();
                
                // Reload data to get updated rankings
                await this.loadFinishers();
            } else {
                throw new Error(response.message || 'Failed to add finisher');
            }
            
        } catch (error) {
            console.error('❌ Failed to add finisher:', error);
            this.showToast('error', error.message || 'Failed to add finisher', 'error');
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = originalContent;
        }
    }

    /**
     * Edit a finisher (make row editable)
     */
    editFinisher(finisherId) {
        console.log('✏️ Editing finisher:', finisherId);
        
        // Cancel any existing edit
        if (this.state.editingRowId) {
            this.cancelEdit();
        }
        
        this.state.editingRowId = finisherId;
        const row = document.querySelector(`[data-finisher-id="${finisherId}"]`);
        
        if (row) {
            this.makeRowEditable(row);
        }
    }

    /**
     * Save edited finisher
     */
    async saveFinisher(finisherId) {
        const row = document.querySelector(`[data-finisher-id="${finisherId}"]`);
        if (!row) return;

        // Extract data from editable inputs
        const bibInput = row.querySelector('.editable-input[data-field="bibNumber"]');
        const nameInput = row.querySelector('.editable-input[data-field="racerName"]');
        const timeInput = row.querySelector('.editable-input[data-field="finishTime"]');

        const updatedData = {
            id: finisherId,
            bibNumber: parseInt(bibInput.value),
            racerName: nameInput.value.trim(),
            finishTime: timeInput.value.trim()
        };

        // Validate the data
        if (!this.validateFinisherData(updatedData)) {
            return;
        }

        // Convert time to milliseconds
        const finishTimeMs = this.timeStringToMilliseconds(updatedData.finishTime);
        if (finishTimeMs === null) {
            this.showToast('error', 'Invalid time format. Use MM:SS.ms', 'warning');
            return;
        }

        const apiData = {
            ...updatedData,
            finishTimeMs: finishTimeMs
        };

        const saveBtn = row.querySelector('.action-button.save');
        const originalContent = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined loading-spinner">progress_activity</span>';

        try {
            // API call to update finisher
            const response = await this.apiCall('PUT', `${this.config.endpoints.results}/${finisherId}`, apiData);
            
            if (response.success) {
                console.log('✅ Finisher updated successfully');
                this.showToast('success', `Updated ${updatedData.racerName}`, 'check_circle');
                
                // Reload data to get updated rankings
                await this.loadFinishers();
                this.state.editingRowId = null;
            } else {
                throw new Error(response.message || 'Failed to update finisher');
            }
            
        } catch (error) {
            console.error('❌ Failed to update finisher:', error);
            this.showToast('error', error.message || 'Failed to update finisher', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalContent;
        }
    }

    /**
     * Delete a finisher
     */
    async deleteFinisher(finisherId) {
        const finisher = this.state.finishers.find(f => f.id === finisherId);
        if (!finisher) return;

        // Show confirmation modal
        this.showModal(
            'Delete Finisher',
            `Are you sure you want to delete ${finisher.racerName} (#${finisher.bibNumber})? This action cannot be undone.`,
            async () => {
                try {
                    // API call to delete finisher
                    const response = await this.apiCall('DELETE', `${this.config.endpoints.results}/${finisherId}`);
                    
                    if (response.success) {
                        console.log('✅ Finisher deleted successfully');
                        this.showToast('success', `Deleted ${finisher.racerName}`, 'delete');
                        
                        // Reload data
                        await this.loadFinishers();
                    } else {
                        throw new Error(response.message || 'Failed to delete finisher');
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to delete finisher:', error);
                    this.showToast('error', error.message || 'Failed to delete finisher', 'error');
                }
            }
        );
    }

    /**
     * API COMMUNICATION
     */
    async apiCall(method, endpoint, data = null) {
        console.log(`🌐 API ${method} ${endpoint}`, data);
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.apiTimeout)
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const fullUrl = `${this.config.apiBaseUrl}${endpoint}`;
            const response = await fetch(fullUrl, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            if (response.status === 204) {
                return { success: true };
            }

            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    /**
     * REAL-TIME SYNC
     */
    startRealTimeSync() {
        const PUBLIC_WEBSOCKET_URL = 'ws://localhost:8000/ws';

        try {
            this.websocket = new WebSocket(PUBLIC_WEBSOCKET_URL);

            this.websocket.onopen = () => {
                console.log('🔄 Real-time sync connection established.');
                this.updateConnectionStatus('connected');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const messageData = JSON.parse(event.data);
                    console.log('🔄 Sync: Received message', messageData);

                    if (messageData.type === 'update') {
                        this.updateOrAddFinisher(messageData.data);
                    } else if (messageData.type === 'delete') {
                        this.removeFinisher(messageData.id);
                    } else if (messageData.type === 'reorder') {
                        this.state.finishers = messageData.data;
                        this.renderFinishers();
                    } else {
                        this.updateOrAddFinisher(messageData);
                    }

                } catch (error) {
                    console.error('❌ Sync: Error parsing message', error);
                }
            };

            this.websocket.onerror = (error) => {
                console.error('❌ Sync: WebSocket error', error);
                this.updateConnectionStatus('disconnected');
            };

            this.websocket.onclose = () => {
                console.log('🔄 Sync: Connection closed. Will attempt to reconnect...');
                this.updateConnectionStatus('disconnected');
                setTimeout(() => this.startRealTimeSync(), 5000);
            };
        } catch (error) {
            console.error('❌ Sync: Failed to establish WebSocket connection', error);
            this.updateConnectionStatus('disconnected');
        }
    }
    
    /**
     * Update or add finisher from sync
     */
    updateOrAddFinisher(finisherData) {
        let existingFinisherIndex = this.state.finishers.findIndex(f => f.id === finisherData.id);
        
        if (existingFinisherIndex === -1) {
            existingFinisherIndex = this.state.finishers.findIndex(f => f.bibNumber === finisherData.bibNumber);
        }

        if (existingFinisherIndex > -1) {
            this.state.finishers[existingFinisherIndex] = {
                ...this.state.finishers[existingFinisherIndex],
                ...finisherData
            };
        } else {
            this.state.finishers.push(finisherData);
        }

        this.state.finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
        this.state.finishers.forEach((finisher, index) => {
            finisher.rank = index + 1;
        });
        
        this.renderFinishers();
    }

    /**
     * Remove finisher from sync
     */
    removeFinisher(finisherId) {
        const finisherIndex = this.state.finishers.findIndex(f => f.id === finisherId);
        if (finisherIndex > -1) {
            const removedFinisher = this.state.finishers.splice(finisherIndex, 1)[0];
            console.log('🗑️ Removed finisher from sync:', removedFinisher);
            
            this.state.finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
            this.state.finishers.forEach((finisher, index) => {
                finisher.rank = index + 1;
            });
            
            this.renderFinishers();
        }
    }

    /**
     * UI HELPER METHODS
     */

    /**
     * Toggle add form visibility
     */
    toggleAddForm() {
        if (this.state.addFormVisible) {
            this.hideAddForm();
        } else {
            this.showAddForm();
        }
    }

    /**
     * Show add form
     */
    showAddForm() {
        this.elements.formCard?.classList.remove('hidden');
        this.state.addFormVisible = true;
        
        // Focus first input
        this.elements.bibNumberInput?.focus();
    }

    /**
     * Hide add form
     */
    hideAddForm() {
        this.elements.formCard?.classList.add('hidden');
        this.elements.addFinisherForm?.reset();
        this.state.addFormVisible = false;
    }

    /**
     * Toggle table visibility
     */
    toggleTable() {
        const isHidden = this.elements.tableContainer?.classList.contains('hidden');
        
        if (isHidden) {
            this.elements.tableContainer?.classList.remove('hidden');
            this.elements.toggleTableButton.innerHTML = '<span class="material-symbols-outlined">expand_less</span> Hide Table';
            this.elements.toggleTableButton.classList.add('active');
        } else {
            this.elements.tableContainer?.classList.add('hidden');
            this.elements.toggleTableButton.innerHTML = '<span class="material-symbols-outlined">expand_more</span> Show Table';
            this.elements.toggleTableButton.classList.remove('active');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.elements.loadingState?.classList.remove('hidden');
        this.elements.emptyState?.classList.add('hidden');
        this.elements.tableContainer?.classList.add('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.elements.loadingState?.classList.add('hidden');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.elements.emptyState?.classList.remove('hidden');
        this.elements.tableContainer?.classList.add('hidden');
    }

    /**
     * Render finishers table
     */
    renderFinishers() {
        const tbody = this.elements.tableBody;
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.state.finishers.length === 0) {
            this.showEmptyState();
            return;
        }

        // Show table and hide empty state
        this.elements.tableContainer?.classList.remove('hidden');
        this.elements.emptyState?.classList.add('hidden');

        // Create table rows
        this.state.finishers.forEach(finisher => {
            const row = this.createFinisherRow(finisher);
            tbody.appendChild(row);
        });
    }

    /**
     * Create a table row for a finisher
     */
    createFinisherRow(finisher) {
        const row = document.createElement('tr');
        row.dataset.finisherId = finisher.id;

        row.innerHTML = `
            <td class="rank-cell">${finisher.rank}</td>
            <td class="bib-cell">#${finisher.bibNumber}</td>
            <td class="name-cell">${finisher.racerName}</td>
            <td class="time-cell">${this.millisecondsToTimeString(finisher.finishTimeMs)}</td>
            <td class="actions-cell">
                <button class="action-button edit" onclick="window.adminDashboard.editFinisher('${finisher.id}')" title="Edit">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="action-button delete" onclick="window.adminDashboard.deleteFinisher('${finisher.id}')" title="Delete">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        `;

        return row;
    }

    /**
     * Make a row editable
     */
    makeRowEditable(row) {
        const finisherId = row.dataset.finisherId;
        const finisher = this.state.finishers.find(f => f.id === finisherId);
        
        if (!finisher) return;

        // Replace cells with inputs
        const bibCell = row.querySelector('.bib-cell');
        const nameCell = row.querySelector('.name-cell');
        const timeCell = row.querySelector('.time-cell');
        const actionsCell = row.querySelector('.actions-cell');

        bibCell.innerHTML = `<input type="number" class="editable-input" data-field="bibNumber" value="${finisher.bibNumber}" min="1" max="9999">`;
        nameCell.innerHTML = `<input type="text" class="editable-input" data-field="racerName" value="${finisher.racerName}" maxlength="50">`;
        timeCell.innerHTML = `<input type="text" class="editable-input" data-field="finishTime" value="${this.millisecondsToTimeString(finisher.finishTimeMs)}" pattern="^[0-9]{2}:[0-9]{2}\\.[0-9]{2}$">`;
        
        actionsCell.innerHTML = `
            <button class="action-button save" onclick="window.adminDashboard.saveFinisher('${finisherId}')" title="Save">
                <span class="material-symbols-outlined">save</span>
            </button>
            <button class="action-button cancel" onclick="window.adminDashboard.cancelEdit()" title="Cancel">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        // Focus first input
        const firstInput = row.querySelector('.editable-input');
        if (firstInput) {
            firstInput.focus();
            firstInput.select();
        }
    }

    /**
     * Cancel editing
     */
    cancelEdit() {
        if (this.state.editingRowId) {
            this.state.editingRowId = null;
            this.renderFinishers();
        }
    }

    /**
     * Show modal dialog
     */
    showModal(title, message, onConfirm) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalOverlay?.classList.remove('hidden');
        
        // Set up confirm handler
        const confirmHandler = () => {
            this.hideModal();
            if (onConfirm) onConfirm();
            this.elements.confirmBtn.removeEventListener('click', confirmHandler);
        };
        
        this.elements.confirmBtn?.addEventListener('click', confirmHandler);
    }

    /**
     * Hide modal dialog
     */
    hideModal() {
        this.elements.modalOverlay?.classList.add('hidden');
    }

    /**
     * Show toast notification
     */
    showToast(type, message, icon = '') {
        if (!this.elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <span class="toast-icon material-symbols-outlined">${icon}</span>
            <div class="toast-message">${message}</div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, this.config.toastDuration);
    }

    /**
     * UTILITY METHODS
     */

    /**
     * Validate finisher data
     */
    validateFinisherData(data) {
        if (!data.bibNumber || data.bibNumber < 1 || data.bibNumber > 9999) {
            this.showToast('error', 'Bib number must be between 1 and 9999', 'warning');
            return false;
        }
        
        if (!data.racerName || data.racerName.length < 2) {
            this.showToast('error', 'Racer name must be at least 2 characters', 'warning');
            return false;
        }
        
        if (!data.finishTime || !this.isValidTimeFormat(data.finishTime)) {
            this.showToast('error', 'Invalid time format. Use MM:SS.ms (e.g., 05:21.35)', 'warning');
            return false;
        }
        
        return true;
    }

    /**
     * Check if time format is valid (MM:SS.ms)
     */
    isValidTimeFormat(timeString) {
        const timeRegex = /^[0-9]{2}:[0-9]{2}\.[0-9]{2}$/;
        return timeRegex.test(timeString);
    }

    /**
     * Convert time string (MM:SS.ms) to milliseconds
     */
    timeStringToMilliseconds(timeString) {
        if (!this.isValidTimeFormat(timeString)) {
            return null;
        }
        
        const [minutes, secondsAndMs] = timeString.split(':');
        const [seconds, centiseconds] = secondsAndMs.split('.');
        
        const totalMs = (parseInt(minutes) * 60 * 1000) + 
                       (parseInt(seconds) * 1000) + 
                       (parseInt(centiseconds) * 10);
        
        return totalMs;
    }

    /**
     * Convert milliseconds to time string (MM:SS.ms)
     */
    millisecondsToTimeString(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);

        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        const formattedMs = ms.toString().padStart(2, '0');

        return `${formattedMinutes}:${formattedSeconds}.${formattedMs}`;
    }

    /**
     * Delay utility for async operations
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance for debugging and onclick handlers
    window.adminDashboard = new RaceAdminDashboard();
});

/**
 * DEBUGGING UTILITIES
 * These functions are available in the browser console for testing
 */

// Bypass login for testing
window.bypassLogin = () => {
    if (window.adminDashboard) {
        window.adminDashboard.authenticateUser();
        console.log('🔓 Login bypassed for testing');
    }
};

// Add test finisher
window.addTestFinisher = (bibNumber, racerName, timeInSeconds) => {
    if (window.adminDashboard && window.adminDashboard.state.isAuthenticated) {
        const finisher = {
            bibNumber: bibNumber || Math.floor(Math.random() * 9999) + 1,
            racerName: racerName || `Test Racer ${Date.now()}`,
            finishTime: window.adminDashboard.millisecondsToTimeString((timeInSeconds || Math.random() * 600 + 300) * 1000)
        };
        
        // Set form values
        if (window.adminDashboard.elements.bibNumberInput) {
            window.adminDashboard.elements.bibNumberInput.value = finisher.bibNumber;
        }
        if (window.adminDashboard.elements.racerNameInput) {
            window.adminDashboard.elements.racerNameInput.value = finisher.racerName;
        }
        if (window.adminDashboard.elements.finishTimeInput) {
            window.adminDashboard.elements.finishTimeInput.value = finisher.finishTime;
        }
        
        // Simulate form submission
        const form = window.adminDashboard.elements.addFinisherForm;
        if (form) {
            window.adminDashboard.handleAddFinisher({ 
                preventDefault: () => {}, 
                target: form 
            });
        }
        
        console.log('✅ Test finisher added:', finisher);
    } else {
        console.log('❌ Please login first or admin dashboard not ready');
    }
};

// Clear all data
window.clearAllData = () => {
    if (window.adminDashboard) {
        window.adminDashboard.state.finishers = [];
        window.adminDashboard.renderFinishers();
        console.log('🧹 All data cleared');
    }
};

// Get current data
window.getCurrentData = () => {
    if (window.adminDashboard) {
        return window.adminDashboard.state.finishers;
    }
    return [];
};
