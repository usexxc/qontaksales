import { useEffect, useState } from "react";
import { List, SignOut } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

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

  useEffect(() => {
    api.get("/auth/profile/").then((res) => setUser(res.data)).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
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
