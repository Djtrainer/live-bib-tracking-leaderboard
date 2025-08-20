import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# --- In-Memory Database ---
# This will store the results while the server is running
race_results: List[Dict[str, Any]] = []

# --- FastAPI App ---
app = FastAPI()

# Add CORS middleware to allow requests from admin UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your actual domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/results")
async def get_results():
    """Endpoint to get the current list of all finishers."""
    # Sort by finish time before returning
    race_results.sort(key=lambda x: x['finishTimeMs'])
    return {"success": True, "data": race_results}

@app.post("/api/results")
async def add_finisher(finisher_data: Dict[str, Any]):
    """Endpoint for your video_inference.py OR admin UI to add a finisher."""
    print(f"Received new finisher via POST: {finisher_data}")
    
    # Add a unique ID for admin UI purposes
    finisher_data['id'] = str(finisher_data['bibNumber']) # Use bib number as a simple ID
    
    race_results.append(finisher_data)
    
    # Broadcast the new finisher to all connected WebSocket clients (leaderboard and admin)
    await manager.broadcast(json.dumps(finisher_data))
    
    return {"success": True, "data": finisher_data}

@app.put("/api/results/{finisher_id}")
async def update_finisher(finisher_id: str, finisher_data: Dict[str, Any]):
    """Endpoint to update an existing finisher."""
    print(f"Updating finisher {finisher_id} with data: {finisher_data}")
    
    # Find the finisher by ID
    for i, finisher in enumerate(race_results):
        if finisher['id'] == finisher_id:
            # Update the finisher data
            finisher_data['id'] = finisher_id
            race_results[i] = finisher_data
            
            # Broadcast the update to all connected WebSocket clients
            await manager.broadcast(json.dumps({"type": "update", "data": finisher_data}))
            
            return {"success": True, "data": finisher_data}
    
    return {"success": False, "message": "Finisher not found"}

@app.delete("/api/results/{finisher_id}")
async def delete_finisher(finisher_id: str):
    """Endpoint to delete a finisher."""
    print(f"Deleting finisher {finisher_id}")
    
    # Find and remove the finisher by ID
    for i, finisher in enumerate(race_results):
        if finisher['id'] == finisher_id:
            deleted_finisher = race_results.pop(i)
            
            # Broadcast the deletion to all connected WebSocket clients
            await manager.broadcast(json.dumps({"type": "delete", "id": finisher_id}))
            
            return {"success": True, "message": "Finisher deleted"}
    
    return {"success": False, "message": "Finisher not found"}

@app.post("/api/reorder")
async def reorder_finishers(order_data: Dict[str, Any]):
    """Endpoint to reorder finishers manually."""
    print(f"Reordering finishers: {order_data}")
    
    new_order = order_data.get('order', [])
    
    # Create a new ordered list based on the provided order
    reordered_results = []
    for order_item in new_order:
        finisher_id = order_item['id']
        rank = order_item['rank']
        
        # Find the finisher and update its rank
        for finisher in race_results:
            if finisher['id'] == finisher_id:
                finisher['rank'] = rank
                reordered_results.append(finisher)
                break
    
    # Update the global race_results
    race_results.clear()
    race_results.extend(reordered_results)
    
    # Broadcast the reorder to all connected WebSocket clients
    await manager.broadcast(json.dumps({"type": "reorder", "data": race_results}))
    
    return {"success": True, "message": "Finishers reordered successfully"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for live leaderboard and admin sync."""
    await manager.connect(websocket)
    print(f"WebSocket client connected. Total clients: {len(manager.active_connections)}")
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"WebSocket client disconnected. Total clients: {len(manager.active_connections)}")

# Mount the current directory to serve static files (index.html, etc.)
app.mount("/", StaticFiles(directory=".", html=True), name="static")
