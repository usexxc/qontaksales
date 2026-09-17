import io
import os
import sys

from PIL import Image, ImageOps

TARGET_RATIO = 0.35  # target: 35% dari ukuran file asli
MAX_DIM = 800        # batasan lebar/tinggi maksimum biar gak resize kebangetan

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.join(HERE, "backend")
OUTPUT_DIR = os.path.join(HERE, "demo_output")


def compress_to_ratio(img, target_bytes, quality=40):
    work = img
    if max(work.size) > MAX_DIM:
        work.thumbnail((MAX_DIM, MAX_DIM), Image.Resampling.LANCZOS)

    buf = io.BytesIO()
    for _ in range(8):
        buf = io.BytesIO()
        work.convert("RGB").save(
            buf, "JPEG", quality=quality, optimize=True, progressive=True
        )
        if buf.tell() <= target_bytes:
            break
        work = work.resize(
            (int(work.width * 0.85), int(work.height * 0.85)),
            Image.Resampling.LANCZOS,
        )
    return buf.getvalue(), work.width, work.height


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        BACKEND, "media", "avatars", "peralta.jpg"
    )
    if not os.path.exists(src):
        sys.exit(f"File gak ada: {src}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    original_bytes = os.path.getsize(src)
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)

    print(f"file   : {src}")
    print(f"asli   : {original_bytes:,} bytes ({original_bytes/1024:.1f} KB)")
    print(f"dimensi: {img.width}x{img.height}")
    print(f"target : <= {int(original_bytes * TARGET_RATIO):,} bytes (35%)\n")

    for q in (45, 35, 25):
        buf = io.BytesIO()
        img.convert("RGB").save(buf, "JPEG", quality=q, optimize=True)
        pct = buf.tell() / original_bytes * 100
        print(f"A. quality={q:<3} -> {buf.tell():,} bytes ({pct:.0f}%) "
              f"{'OK' if pct <= 35 else 'GAK SAMPE TARGET'}")

    data, w, h = compress_to_ratio(img, int(original_bytes * TARGET_RATIO))
    out_b = os.path.join(OUTPUT_DIR, "B_hasil_kompres.jpg")
    with open(out_b, "wb") as f:
        f.write(data)
    print(f"\nB. loop target 35% -> {len(data):,} bytes "
          f"({len(data)/original_bytes*100:.0f}%), {w}x{h}")
    print(f"   disimpan: {out_b}")

    print(f"\nHemat  : {original_bytes - len(data):,} bytes "
          f"({(1 - len(data)/original_bytes)*100:.0f}% lebih kecil)")


if __name__ == "__main__":
    main()
