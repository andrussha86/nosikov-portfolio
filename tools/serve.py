"""Локальный сервер только для файлов сайта.

В отличие от `python -m http.server` не отдаёт служебное (.git, tools, src, site…)
и не показывает списки файлов в папках — безопасно открывать через туннель.
Запуск: python tools/serve.py [порт]
"""
import http.server
import os
import sys
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLOWED_TOP = {"index.html", "parq.html", "meteoritm.html", "style.css", "site.js", "gradient.js", "img"}
ALLOWED_EXT = {".html", ".css", ".js", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico"}


class SiteHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        parts = [p for p in path.split("/") if p]
        if not parts:
            return super().send_head()          # "/" -> index.html
        ext = os.path.splitext(parts[-1])[1].lower()
        if parts[0] not in ALLOWED_TOP or ext not in ALLOWED_EXT or any(p.startswith(".") or p == ".." for p in parts):
            self.send_error(404, "Not found")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    handler = partial(SiteHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"Сайт: http://127.0.0.1:{port}")
        httpd.serve_forever()
