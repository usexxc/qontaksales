import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import api from "@/services/api";
import { firstApiError } from "@/services/format";
import brandLogo from "@/assets/brand.png";
import LoadingPopup from "@/components/ui/LoadingPopup";
import { inputCls, labelCls } from "@/components/ui/form";

const PERKS = [
  "Gratis selamanya buat tim kecil",
  "Setup gak sampai 2 menit",
  "Gak butuh kartu kredit",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirm: "",
    company_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (localStorage.getItem("access_token")) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (form.password !== form.password_confirm) {
      setError("Password-nya gak sama.");
      setLoading(false);
      return;
    }
    try {
      await api.post("/auth/register/", {
        name: form.name,
        email: form.email,
        password: form.password,
        company_name: form.company_name,
      });
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setError(firstApiError(data, "Pendaftaran gagal"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* panel branding */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-primary p-12 text-white md:flex">
        <div className="absolute -bottom-24 -left-24 h-[300px] w-[300px] rounded-full bg-white/5" />
        <div className="absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full bg-white/5" />
        <div className="relative z-10 flex flex-col items-start gap-8">
          <img src={brandLogo} alt="QontakSales" className="h-10 brightness-0 invert" />
          <div className="flex flex-col items-start gap-4">
            <p className="text-lg opacity-90">Mulai rapikan pipeline penjualan hari ini.</p>
            <div className="mt-4 flex flex-col items-start gap-3">
              {PERKS.map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="text-sm opacity-80">{t}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* area form */}
      <div className="flex-1 overflow-auto bg-background p-8">
        <div className="flex min-h-full items-center justify-center">
          <div className="w-full max-w-[480px]">
            <div className="flex flex-col items-center gap-6 md:items-start">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Bikin akunmu
                </h1>
                <p className="text-sm text-foreground/60">
                  Pakai QontakSales gratis, mulai dari sini
                </p>
              </div>

              <div className="w-full rounded-2xl border border-app-border bg-white p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <p className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className={labelCls}>Nama Lengkap</label>
                    <input
                      name="name"
                      className={inputCls}
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Nama kamu"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      name="email"
                      type="email"
                      className={inputCls}
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Perusahaan</label>
                    <input
                      name="company_name"
                      className={inputCls}
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="PT Maju Jaya"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>Password</label>
                      <input
                        name="password"
                        type="password"
                        className={inputCls}
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Minimal 8 karakter"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Konfirmasi</label>
                      <input
                        name="password_confirm"
                        type="password"
                        className={inputCls}
                        value={form.password_confirm}
                        onChange={handleChange}
                        placeholder="Ulangi password"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:bg-secondary disabled:opacity-60"
                  >
                    {loading ? "Membuat akun..." : "Daftar"}
                  </button>
                </form>
              </div>

              <p className="text-sm text-foreground/60">
                Udah punya akun?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadingPopup open={loading} message="Membuat akun..." />
    </div>
  );
}
