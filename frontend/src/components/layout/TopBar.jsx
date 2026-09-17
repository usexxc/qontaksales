import { useEffect, useRef, useState } from "react";
import { Camera, List, SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { toast } from "@/components/ui/toast";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get("/auth/profile/").then((res) => setUser(res.data)).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // biar bisa upload file yang sama lagi
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Pilih file gambar, ya.", "error");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast("Ukuran foto maksimal 1 MB.", "error");
      return;
    }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await api.patch("/auth/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
      toast("Foto profil berhasil diperbarui", "success");
    } catch (error) {
      const msg = error.response?.data?.avatar?.[0] || "Gagal upload foto profil.";
      toast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const fullName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : "User";

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-app-border bg-white px-4 md:px-6">
      <button
        className="cursor-pointer rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <List size={22} />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-sm font-semibold">{fullName}</span>
          <span className="text-xs text-foreground/55">{user?.role || ""}</span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Ganti foto profil"
          aria-label="Ganti foto profil"
          className="group relative cursor-pointer rounded-full disabled:opacity-60"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={fullName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {initials(fullName)}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera size={16} />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAvatarChange}
        />
        <button
          onClick={logout}
          title="Keluar"
          className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-red-50"
        >
          <SignOut size={18} />
        </button>
      </div>
    </header>
  );
}
