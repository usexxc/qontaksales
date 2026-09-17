"""Demo web kompresi gambar - murni stdlib + Pillow, gak pake framework.

Jalanin:
    cd demo-web
    ../backend/venv/bin/python server.py

Buka: http://localhost:8123
"""
import base64
import io
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from PIL import Image, ImageOps

PORT = 8123
TARGET_RATIO = 0.35   # target file jadi 35% dari ukuran aslinya
MAX_UPLOAD = 1024 * 1024  # aturan: foto profil gak boleh lebih dari 1 MB
HERE = os.path.dirname(os.path.abspath(__file__))


def kompres(data, target_ratio=TARGET_RATIO, quality=40):
    img = Image.open(io.BytesIO(data))
    format_asli = (img.format or "?").lower()
    img = ImageOps.exif_transpose(img)  # benerin rotasi EXIF dulu
    original = len(data)
    target = int(original * target_ratio)

    work = img
    if max(work.size) > 800:
        work.thumbnail((800, 800), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    for _ in range(8):
        buf = io.BytesIO()
        work.convert("RGB").save(
            buf, "JPEG", quality=quality, optimize=True, progressive=True
        )
        if buf.tell() <= target:
            break
        work = work.resize(
            (int(work.width * 0.85), int(work.height * 0.85)),
            Image.Resampling.LANCZOS,
        )

    return {
        "original_size": original,
        "new_size": buf.tell(),
        "pct": round(buf.tell() / original * 100),
        "width": work.width,
        "height": work.height,
        "format_asli": format_asli,
        "image_b64": base64.b64encode(buf.getvalue()).decode(),
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/index.html"):
            with open(os.path.join(HERE, "index.html"), "rb") as f:
                body = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/api/kompres":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        data = self.rfile.read(length)

        # aturan foto profil: file di atas 1 MB ditolak, tidak dikompres
        if length > MAX_UPLOAD:
            result = {"error": f"File terlalu besar ({length // 1024} KB). "
                               "Foto profil maksimal 1 MB."}
            status = 400
        else:
            try:
                result = kompres(data)
                status = 200
            except Exception:
                result = {"error": "File bukan gambar yang bisa dibaca."}
                status = 400

        body = json.dumps(result).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass  # biar terminal gak rame


if __name__ == "__main__":
    print(f"Demo kompresi jalan di http://localhost:{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
