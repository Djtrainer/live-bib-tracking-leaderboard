import http.server
import socketserver
import json
import threading

# A simple thread-safe list to store results in memory
class RaceResults:
    def __init__(self):
        self.finishers = []
        self.lock = threading.Lock()

    def add_finisher(self, data):
        with self.lock:
            self.finishers.append(data)
            # Keep the list sorted by finish time
            self.finishers.sort(key=lambda x: x['finishTimeMs'])

    def get_results(self):
        with self.lock:
            return self.finishers

# Global instance to hold our race results
race_results = RaceResults()

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle GET request for the results
        if self.path == '/results':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*') # Allow cross-origin requests
            self.end_headers()
            self.wfile.write(json.dumps(race_results.get_results()).encode('utf-8'))
        else:
            # Serve files (index.html, etc.) for all other GET requests
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        # Handle POST request to add a new finisher
        if self.path == '/add_finisher':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            finisher_data = json.loads(post_data)
            
            print(f"Received new finisher via POST: {finisher_data}")
            race_results.add_finisher(finisher_data)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'success'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    PORT = 8000
    Handler = MyHttpRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🏆 Local leaderboard server running at http://localhost:{PORT}")
        print("  - View the leaderboard in your browser.")
        print("  - Send POST requests to http://localhost:8000/add_finisher to add results.")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()