#!/usr/bin/env python3
"""
SizeNotes Local Mobile Dev Server
Serves the measurement app and outputs local WiFi addresses for testing directly on phone.
"""

import http.server
import socketserver
import socket
import os
import sys

PORT = 8080

def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable caching & CORS headers
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_ip_address()
    
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print("=" * 60)
        print("📐 SizeNotes - Mobile Measurement & PDF App Server Running")
        print("=" * 60)
        print(f"  • Local Computer: http://localhost:{PORT}")
        print(f"  • On Your Phone (same Wi-Fi): http://{local_ip}:{PORT}")
        print("=" * 60)
        print("Press Ctrl+C to stop server.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")

if __name__ == '__main__':
    main()
