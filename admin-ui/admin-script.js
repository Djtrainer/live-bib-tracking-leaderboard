/**
 * Race Admin Dashboard - JavaScript Controller
 * 
 * This script handles:
 * 1. Authentication and login gate
 * 2. CRUD operations for race results
 * 3. API communication with backend
 * 4. Drag-and-drop reordering
 * 5. Real-time UI updates
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
            draggedElement: null
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
            connectionDot: document.getElementById('connectionDot'),
            connectionStatus: document.getElementById('connectionStatus'),
            logoutBtn: document.getElementById('logoutBtn'),
            
            // Form elements
            toggleFormBtn: document.getElementById('toggleFormBtn'),
            addFormContainer: document.getElementById('addFormContainer'),
            addFinisherForm: document.getElementById('addFinisherForm'),
            cancelAddBtn: document.getElementById('cancelAddBtn'),
            
            // Table elements
            refreshBtn: document.getElementById('refreshBtn'),
            recordCount: document.getElementById('recordCount'),
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            tableWrapper: document.getElementById('tableWrapper'),
            adminTableBody: document.getElementById('adminTableBody'),
            
            // Modal elements
            modalOverlay: document.getElementById('modalOverlay'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            confirmBtn: document.getElementById('confirmBtn'),
            modalCancelBtn: document.getElementById('modalCancelBtn'),
            
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
        this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Logout button
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        
        // Form toggle
        this.elements.toggleFormBtn.addEventListener('click', () => this.toggleAddForm());
        this.elements.cancelAddBtn.addEventListener('click', () => this.hideAddForm());
        
        // Add finisher form
        this.elements.addFinisherForm.addEventListener('submit', (e) => this.handleAddFinisher(e));
        
        // Refresh button
        this.elements.refreshBtn.addEventListener('click', () => this.loadFinishers());
        
        // Modal buttons
        this.elements.modalCancelBtn.addEventListener('click', () => this.hideModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
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
        const loginBtn = event.target.querySelector('.login-btn');
        
        // Show loading state
        loginBtn.classList.add('loading');
        this.elements.loginError.classList.add('hidden');
        
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
            this.elements.loginError.classList.remove('hidden');
            this.elements.passwordInput.focus();
            this.elements.passwordInput.select();
        } finally {
            loginBtn.classList.remove('loading');
        }
    }

    /**
     * Authenticate user and show admin interface
     */
    async authenticateUser() {
        console.log('✅ User authenticated');
        
        this.state.isAuthenticated = true;
        
        // Hide login, show admin interface
        this.elements.loginContainer.classList.add('hidden');
        this.elements.adminContainer.classList.remove('hidden');
        
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
        this.elements.loginForm.reset();
        this.elements.addFinisherForm.reset();
        this.hideAddForm();
        this.hideModal();
        
        // Show login, hide admin interface
        this.elements.adminContainer.classList.add('hidden');
        this.elements.loginContainer.classList.remove('hidden');
        
        // Focus password input
        this.elements.passwordInput.focus();
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const dot = this.elements.connectionDot;
        const text = this.elements.connectionStatus;
        
        // Remove all status classes
        dot.classList.remove('connected', 'disconnected');
        
        switch (status) {
            case 'connected':
                dot.classList.add('connected');
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                dot.classList.add('disconnected');
                text.textContent = 'Disconnected';
                break;
            case 'connecting':
            default:
                text.textContent = 'Connecting...';
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
                this.showToast('success', `Loaded ${this.state.finishers.length} finishers`, '📊');
            } else {
                throw new Error(response.message || 'Failed to load finishers');
            }
            
        } catch (error) {
            console.error('❌ Failed to load finishers:', error);
            this.updateConnectionStatus('disconnected');
            this.showToast('error', 'Failed to load race data', '❌');
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
        
        const formData = new FormData(event.target);
        const finisherData = {
            bibNumber: parseInt(formData.get('bibNumber')),
            racerName: formData.get('racerName').trim(),
            finishTime: formData.get('finishTime').trim()
        };

        // Validate the data
        if (!this.validateFinisherData(finisherData)) {
            return;
        }

        // Convert time to milliseconds for API
        const finishTimeMs = this.timeStringToMilliseconds(finisherData.finishTime);
        if (finishTimeMs === null) {
            this.showToast('error', 'Invalid time format. Use MM:SS.ms', '⚠️');
            return;
        }

        const apiData = {
            ...finisherData,
            finishTimeMs: finishTimeMs
        };

        const addBtn = event.target.querySelector('.add-btn');
        addBtn.classList.add('loading');

        try {
            // API call to add new finisher
            const response = await this.apiCall('POST', this.config.endpoints.results, apiData);
            
            if (response.success) {
                console.log('✅ Finisher added successfully');
                this.showToast('success', `Added ${finisherData.racerName} (#${finisherData.bibNumber})`, '✅');
                
                // Reset form and hide it
                event.target.reset();
                this.hideAddForm();
                
                // Reload data to get updated rankings
                await this.loadFinishers();
            } else {
                throw new Error(response.message || 'Failed to add finisher');
            }
            
        } catch (error) {
            console.error('❌ Failed to add finisher:', error);
            this.showToast('error', error.message || 'Failed to add finisher', '❌');
        } finally {
            addBtn.classList.remove('loading');
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
            this.showToast('error', 'Invalid time format. Use MM:SS.ms', '⚠️');
            return;
        }

        const apiData = {
            ...updatedData,
            finishTimeMs: finishTimeMs
        };

        const saveBtn = row.querySelector('.save-btn');
        saveBtn.classList.add('loading');

        try {
            // API call to update finisher
            const response = await this.apiCall('PUT', `${this.config.endpoints.results}/${finisherId}`, apiData);
            
            if (response.success) {
                console.log('✅ Finisher updated successfully');
                this.showToast('success', `Updated ${updatedData.racerName}`, '✅');
                
                // Reload data to get updated rankings
                await this.loadFinishers();
                this.state.editingRowId = null;
            } else {
                throw new Error(response.message || 'Failed to update finisher');
            }
            
        } catch (error) {
            console.error('❌ Failed to update finisher:', error);
            this.showToast('error', error.message || 'Failed to update finisher', '❌');
        } finally {
            saveBtn.classList.remove('loading');
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
                        this.showToast('success', `Deleted ${finisher.racerName}`, '🗑️');
                        
                        // Reload data
                        await this.loadFinishers();
                    } else {
                        throw new Error(response.message || 'Failed to delete finisher');
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to delete finisher:', error);
                    this.showToast('error', error.message || 'Failed to delete finisher', '❌');
                }
            }
        );
    }

    /**
     * DRAG AND DROP FUNCTIONALITY
     */

    /**
     * Set up drag and drop for a row
     */
    setupDragAndDrop(row) {
        const dragHandle = row.querySelector('.drag-handle');
        
        dragHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.startDrag(row, e);
        });

        // Touch events for mobile
        dragHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrag(row, e.touches[0]);
        });
    }

    /**
     * Start dragging a row
     */
    startDrag(row, event) {
        this.state.draggedElement = row;
        row.classList.add('dragging');
        
        const tbody = this.elements.adminTableBody;
        const rows = Array.from(tbody.children);
        
        const mouseMoveHandler = (e) => {
            const afterElement = this.getDragAfterElement(tbody, e.clientY || e.touches[0].clientY);
            
            if (afterElement == null) {
                tbody.appendChild(row);
            } else {
                tbody.insertBefore(row, afterElement);
            }
        };

        const mouseUpHandler = async () => {
            row.classList.remove('dragging');
            
            // Calculate new order
            const newOrder = Array.from(tbody.children).map((row, index) => ({
                id: row.dataset.finisherId,
                rank: index + 1
            }));

            // Send reorder request to API
            await this.reorderFinishers(newOrder);
            
            // Clean up event listeners
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            document.removeEventListener('touchmove', mouseMoveHandler);
            document.removeEventListener('touchend', mouseUpHandler);
            
            this.state.draggedElement = null;
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        document.addEventListener('touchmove', mouseMoveHandler);
        document.addEventListener('touchend', mouseUpHandler);
    }

    /**
     * Get the element after which the dragged element should be inserted
     */
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Send reorder request to API
     */
    async reorderFinishers(newOrder) {
        try {
            console.log('🔄 Reordering finishers...', newOrder);
            
            // API call to reorder finishers
            const response = await this.apiCall('POST', this.config.endpoints.reorder, { order: newOrder });
            
            if (response.success) {
                console.log('✅ Finishers reordered successfully');
                this.showToast('success', 'Rankings updated', '🔄');
                
                // Reload data to reflect new order
                await this.loadFinishers();
            } else {
                throw new Error(response.message || 'Failed to reorder finishers');
            }
            
        } catch (error) {
            console.error('❌ Failed to reorder finishers:', error);
            this.showToast('error', 'Failed to update rankings', '❌');
            
            // Reload original order
            await this.loadFinishers();
        }
    }

    /**
     * API COMMUNICATION
     * Makes real API calls to the backend with proper error handling.
     */
    async apiCall(method, endpoint, data = null) {
        console.log(`🌐 API ${method} ${endpoint}`, data);
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    // In a real app, you would add your authentication token here
                    // 'Authorization': `Bearer ${this.getAuthToken()}`
                },
                signal: AbortSignal.timeout(this.config.apiTimeout) // Add a timeout
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            // Construct the full URL for the API call
            const fullUrl = `${this.config.apiBaseUrl}${endpoint}`;
            const response = await fetch(fullUrl, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // For DELETE requests, there might be no content to parse
            if (response.status === 204) {
                return { success: true };
            }

            const result = await response.json();
            return result; // Your backend should return a { success: true, ... } structure
            
        } catch (error) {
            console.error('API call failed:', error);
            // Re-throw the error so the calling function can handle it
            throw error;
        }
    }

    /**
     * REAL-TIME SYNC
     * Connects to the public WebSocket to receive live updates.
     */
    startRealTimeSync() {
        // Use the correct WebSocket URL (ws:// not http://)
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

                    // Handle different message types from the server
                    if (messageData.type === 'update') {
                        // Handle finisher update
                        this.updateOrAddFinisher(messageData.data);
                    } else if (messageData.type === 'delete') {
                        // Handle finisher deletion
                        this.removeFinisher(messageData.id);
                    } else if (messageData.type === 'reorder') {
                        // Handle reorder - reload all data
                        this.state.finishers = messageData.data;
                        this.renderFinishers();
                    } else {
                        // Handle simple finisher addition (backward compatibility)
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
     * A helper to smartly add/update finishers received from the sync connection
     */
    updateOrAddFinisher(finisherData) {
        // Use id for matching first, then fall back to bibNumber for new additions
        let existingFinisherIndex = this.state.finishers.findIndex(f => f.id === finisherData.id);
        
        if (existingFinisherIndex === -1) {
            // If no id match, try bibNumber for backward compatibility
            existingFinisherIndex = this.state.finishers.findIndex(f => f.bibNumber === finisherData.bibNumber);
        }

        if (existingFinisherIndex > -1) {
            // Update existing finisher
            this.state.finishers[existingFinisherIndex] = {
                ...this.state.finishers[existingFinisherIndex],
                ...finisherData
            };
        } else {
            // Add as a new finisher
            this.state.finishers.push(finisherData);
        }

        // Sort by finish time and re-render the table
        this.state.finishers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
        this.state.finishers.forEach((finisher, index) => {
            finisher.rank = index + 1;
        });
        
        this.renderFinishers();
    }

    /**
     * Remove a finisher from the local state (used for WebSocket delete messages)
     */
    removeFinisher(finisherId) {
        const finisherIndex = this.state.finishers.findIndex(f => f.id === finisherId);
        if (finisherIndex > -1) {
            const removedFinisher = this.state.finishers.splice(finisherIndex, 1)[0];
            console.log('🗑️ Removed finisher from sync:', removedFinisher);
            
            // Re-rank remaining finishers and re-render
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
     * Show/hide add form
     */
    toggleAddForm() {
        const isHidden = this.elements.addFormContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.showAddForm();
        } else {
            this.hideAddForm();
        }
    }

    showAddForm() {
        this.elements.addFormContainer.classList.remove('hidden');
        this.elements.toggleFormBtn.innerHTML = '<span>➖</span> Hide Form';
        
        // Focus first input
        const firstInput = this.elements.addFormContainer.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }

    hideAddForm() {
        this.elements.addFormContainer.classList.add('hidden');
        this.elements.toggleFormBtn.innerHTML = '<span>➕</span> Show Form';
        this.elements.addFinisherForm.reset();
    }

    /**
     * Show/hide loading state
     */
    showLoadingState() {
        this.elements.loadingState.classList.remove('hidden');
        this.elements.emptyState.classList.add('hidden');
        this.elements.tableWrapper.classList.add('hidden');
    }

    hideLoadingState() {
        this.elements.loadingState.classList.add('hidden');
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.elements.emptyState.classList.remove('hidden');
        this.elements.tableWrapper.classList.add('hidden');
        this.elements.recordCount.textContent = '0 finishers';
    }

    /**
     * Render finishers table
     */
    renderFinishers() {
        const tbody = this.elements.adminTableBody;
        tbody.innerHTML = '';

        if (this.state.finishers.length === 0) {
            this.showEmptyState();
            return;
        }

        // Show table and update count
        this.elements.tableWrapper.classList.remove('hidden');
        this.elements.emptyState.classList.add('hidden');
        this.elements.recordCount.textContent = `${this.state.finishers.length} finisher${this.state.finishers.length !== 1 ? 's' : ''}`;

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
            <td class="drag-handle">⋮⋮</td>
            <td class="rank-cell">${finisher.rank}</td>
            <td class="bib-cell">#${finisher.bibNumber}</td>
            <td class="name-cell">${finisher.racerName}</td>
            <td class="time-cell">${this.millisecondsToTimeString(finisher.finishTimeMs)}</td>
            <td class="actions-cell">
                <button class="edit-btn" onclick="window.adminDashboard.editFinisher('${finisher.id}')">
                    ✏️ Edit
                </button>
                <button class="delete-btn" onclick="window.adminDashboard.deleteFinisher('${finisher.id}')">
                    🗑️ Delete
                </button>
            </td>
        `;

        // Set up drag and drop
        this.setupDragAndDrop(row);

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
            <button class="save-btn" onclick="window.adminDashboard.saveFinisher('${finisherId}')">
                💾 Save
            </button>
            <button class="cancel-btn" onclick="window.adminDashboard.cancelEdit()">
                ❌ Cancel
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
            this.renderFinishers(); // Re-render to restore original state
        }
    }

    /**
     * Show modal dialog
     */
    showModal(title, message, onConfirm) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalOverlay.classList.remove('hidden');
        
        // Set up confirm handler
        const confirmHandler = () => {
            this.hideModal();
            if (onConfirm) onConfirm();
            this.elements.confirmBtn.removeEventListener('click', confirmHandler);
        };
        
        this.elements.confirmBtn.addEventListener('click', confirmHandler);
    }

    /**
     * Hide modal dialog
     */
    hideModal() {
        this.elements.modalOverlay.classList.add('hidden');
    }

    /**
     * Show toast notification
     */
    showToast(type, message, icon = '') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
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
            this.showToast('error', 'Bib number must be between 1 and 9999', '⚠️');
            return false;
        }
        
        if (!data.racerName || data.racerName.length < 2) {
            this.showToast('error', 'Racer name must be at least 2 characters', '⚠️');
            return false;
        }
        
        if (!data.finishTime || !this.isValidTimeFormat(data.finishTime)) {
            this.showToast('error', 'Invalid time format. Use MM:SS.ms (e.g., 05:21.35)', '⚠️');
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
        const ms = Math.floor((milliseconds % 1000) / 10); // Get centiseconds

        // Format with leading zeros
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
        
        // Simulate form submission
        const form = document.getElementById('addFinisherForm');
        form.bibNumber.value = finisher.bibNumber;
        form.racerName.value = finisher.racerName;
        form.finishTime.value = finisher.finishTime;
        
        window.adminDashboard.handleAddFinisher({ 
            preventDefault: () => {}, 
            target: form 
        });
        
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
