import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  UsersThree,
  Target,
  Coins,
  Trophy,
} 
from "@phosphor-icons/react";
import api from "@/services/api";
import { rupiah } from "@/services/format";
import { cardCls } from "@/components/ui/form";
import Spinner from "@/components/ui/Spinner";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard/stats/")
      .then((res) => setStats(res.data))
      .catch(() => setError("Dashboard gagal dimuat."));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!stats)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="xl" />
      </div>
    );

  const cards = [
    { label: "Total Pengguna", value: stats.total_users, icon: Users },
    { label: "Total Agents", value: stats.total_agents, icon: UserPlus },
    { label: "Total Managers", value: stats.total_managers, icon: ShieldCheck },
    { label: "Total Customers", value: stats.total_customers, icon: UsersThree },
    { label: "Prospect", value: stats.total_prospects, icon: Target },
    { label: "Saldo COA", value: rupiah(stats.coa_total_saldo), icon: Coins },
  ];

  const statusMap = stats.customers_by_status || {};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {stats.company_name || "QontakSales"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${cardCls} p-5`}>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-foreground/60">{label}</span>
                <span
                  className={`font-bold ${
                    label === "Saldo COA" ? "text-lg" : "text-3xl"
                  }`}>
                  {value}
                </span>
              </div>
              <span className="rounded-lg bg-primary/10 p-3 text-primary">
                <Icon size={28} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${cardCls} p-5`}>
          <h2 className="mb-3 text-base font-semibold">
            Customer per Status
          </h2>
          {Object.keys(statusMap).length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada customer.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {["PROSPECT", "CUSTOMER", "INACTIVE"].map((st) =>
                statusMap[st] ? (
                  <li
                    key={st}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize text-slate-600">{st.toLowerCase()}</span>
                    <span className="font-semibold">{statusMap[st]}</span>
                  </li>
                ) : null
              )}
            </ul>
          )}
        </div>

        <div className={`${cardCls} p-5`}>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Trophy size={18} className="text-accent" />
            Top Agent (berdasar customer)
          </h2>
          {!stats.top_agents?.length ? (
            <p className="text-sm text-slate-500">Belum ada data.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {stats.top_agents.map((a, i) => (
                <li
                  key={a.username}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    {a.username}
                  </span>
                  <span className="font-semibold">{a.customers} customer</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
