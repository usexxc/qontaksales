import { Link as RouterLink, useLocation } from "react-router-dom";
import { House, UserPlus, ChartBar, Users, X } from "@phosphor-icons/react";
import brandLogo from "@/assets/brand.png";

const navItems = [
  { label: "Dashboard", icon: House, path: "/dashboard" },
  { label: "Agents", icon: UserPlus, path: "/agents", managerOnly: true },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Chart of Accounts", icon: ChartBar, path: "/coa" },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const isManager = localStorage.getItem("user_role") === "MANAGER";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-50 flex h-screen w-[260px] flex-col border-r border-app-border bg-white transition-transform duration-200 md:relative md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <img src={brandLogo} alt="QontakSales" className="h-7" />
          <button
            className="cursor-pointer text-foreground md:hidden"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex-col gap-1 px-3 md:flex">
          {navItems
            .filter((item) => !item.managerOnly || isManager)
            .map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <RouterLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                    active
                      ? "bg-primary font-semibold text-white"
                      : "font-normal text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </RouterLink>
              );
            })}
        </nav>
      </aside>
    </>
  );
}
