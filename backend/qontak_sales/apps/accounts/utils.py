import io
import os

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image, ImageOps

TARGET_RATIO = 0.35
MAX_DIM = 800        # batasan lebar/tinggi maksimum biar gak resize kebangetan
MIN_BYTES = 50_000  # file kecil di bawah ini tidak dikompres takut boros
FLOOR_QUALITY = 20  # batas bawah kualitas; di bawah ini gambar terlalu pecah


def compress_image(data, original_size=None, target_ratio=TARGET_RATIO):
    original_size = original_size or len(data)
    if original_size < MIN_BYTES:
        return data

    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img)
    if max(img.size) > MAX_DIM:
        img.thumbnail((MAX_DIM, MAX_DIM), Image.Resampling.LANCZOS)

    has_alpha = img.mode in ("RGBA", "LA", "PA") or (
        img.mode == "P" and "transparency" in img.info
    )
    fmt = "PNG" if has_alpha else "JPEG"

    target_bytes = int(original_size * target_ratio)
    quality = 40
    out = b""
    for _ in range(8):
        buf = io.BytesIO()
        img.save(buf, fmt, quality=quality, optimize=True)
        out = buf.getvalue()
        if len(out) <= target_bytes or quality <= FLOOR_QUALITY:
            break
        quality = max(FLOOR_QUALITY, int(quality * 0.8))
        img = img.resize(
            (max(1, int(img.width * 0.85)), max(1, int(img.height * 0.85))),
            Image.Resampling.LANCZOS,
        )

    if not out or len(out) >= original_size:
        return data
    return out


def compress_avatar_on_save(instance, file_field="avatar"):
    """Kompres file avatar sebelum disimpan (dipanggil dari signal pre_save).

    Hanya jalan kalau file benar-benar baru/diubah: bandingkan nama file
    dengan nilai saat objek dibaca dari DB supaya save data lain tidak
    mengompres ulang file lama.
    """
    f = getattr(instance, file_field, None)
    if not f or not getattr(f, "size", None):
        return

    if not instance._state.adding and f.name == getattr(instance, "_initial_avatar_pk", None):
        return

    try:
        f.open("rb")
        data = f.read()
        f.seek(0)
    except Exception:
        return
    if not data:
        return
    compressed = compress_image(data, original_size=len(data))
    if len(compressed) < len(data):
        name = f.name or "avatar.jpg"
        if not name.lower().endswith((".jpg", ".jpeg")):
            name = os.path.splitext(name)[0] + ".jpg"
        setattr(
            instance,
            file_field,
            SimpleUploadedFile(name, compressed, content_type="image/jpeg"),
        )
