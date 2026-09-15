import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  Eye,
  EyeClosed,
  Lightning,
  ChartLineUp,
  Kanban,
} 
from "@phosphor-icons/react";
import api from "@/services/api";
import brandLogo from "@/assets/brand.png";
import LoadingPopup from "@/components/ui/LoadingPopup";
import { inputCls, labelCls } from "@/components/ui/form";

const features = [
  { icon: ChartLineUp, title: "Pantau Performa", desc: "Analitik & laporan real-time" },
  { icon: Kanban, title: "Kelola Pipeline", desc: "Papan Kanban visual" },
  { icon: Lightning, title: "Closing Lebih Cepat", desc: "Laju penjualan naik terus" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (localStorage.getItem("access_token")) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/token/", { email, password });
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      const profile = await api.get("/auth/profile/");
      localStorage.setItem("user_role", profile.data.role);
      localStorage.setItem("user_name", `${profile.data.first_name} ${profile.data.last_name}`);
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.error ||
        "Email atau password salah";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* panel branding */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-primary p-12 text-white md:flex">
        <div className="absolute inset-0 opacity-10">
          <Kanban size={400} weight="light" className="absolute -right-12 -top-12" />
        </div>
        <div className="relative z-10 flex flex-col items-start gap-8">
          <img src={brandLogo} alt="QontakSales" className="h-10 brightness-0 invert" />
          <div className="flex flex-col items-start gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <span className="rounded-lg bg-white/20 p-3">
                  <Icon size={24} />
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{title}</span>
                  <span className="text-sm opacity-80">{desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* area form */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-[400px]">
          <div className="flex flex-col items-center gap-8 md:items-start">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-foreground">Selamat datang kembali</h1>
              <p className="text-sm text-foreground/60">
                Masuk ke akunmu buat lanjut
              </p>
            </div>

            <div className="w-full rounded-2xl border border-app-border bg-white p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && (
                  <p className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@kamu.com"
                    required
                  />
                </div>
                <div className="relative">
                  <label className={labelCls}>Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputCls} pr-11`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password kamu"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-foreground/50 hover:text-foreground"
                    aria-label="Tampil/sembunyi password"
                  >
                    {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-secondary disabled:opacity-60">
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>
            </div>

            <p className="text-sm text-foreground/60">
              Belum punya akun?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">Daftar gratis</Link>
            </p>
          </div>
        </div>
      </div>

      <LoadingPopup open={loading} message="Memproses..." />
    </div>
  );
}
