import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, UserPlus, Camera } from "@phosphor-icons/react";
import api, { getAll } from "@/services/api";
import { firstApiError } from "@/services/format";
import { toast } from "@/components/ui/toast";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { cardCls, inputCls, labelCls, btnPrimary, btnOutline } from "@/components/ui/form";

const emptyForm = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
};

function Avatar({ src, name, size = "sm" }) {
  const cls =
    size === "xl"
      ? "h-24 w-24 text-2xl"
      : size === "lg"
        ? "h-14 w-14 text-base"
        : "h-9 w-9 text-xs";
  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return src ? (
    <img src={src} alt={name || "avatar"} className={`${cls} rounded-full object-cover`} />
  ) : (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white`}
    >
      {initials || "?"}
    </span>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await getAll("/agents/");
      setAgents(response);
    } catch (error) {
      console.error("Gagal mengambil agent:", error);
      toast(
        error.response?.data?.detail || "Gagal mengambil data agent",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setEditAgent(null);
    setForm(emptyForm);
    setAvatarFile(null);
    setAvatarPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (agent) => {
    setEditAgent(agent);
    setForm({
      username: agent.username || "",
      email: agent.email || "",
      password: "",
      first_name: agent.first_name || "",
      last_name: agent.last_name || "",
      phone: agent.phone || "",
    });
    setAvatarFile(null);
    setAvatarPreview(agent.avatar_url || null);
    setDialogOpen(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast("Ukuran foto maksimal 1 MB.", "error");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLoading) return;

    if (!editAgent && form.password.length < 8) {
      toast("Password minimal 8 karakter.", "error");
      return;
    }
    if (!form.username.trim()) {
      toast("Username wajib diisi", "error");
      return;
    }
    if (!form.email.trim()) {
      toast("Email wajib diisi", "error");
      return;
    }

    try {
      setSubmitLoading(true);

      const formData = new FormData();
      formData.append("username", form.username.trim());
      formData.append("email", form.email.trim());
      formData.append("first_name", form.first_name.trim());
      formData.append("last_name", form.last_name.trim());
      formData.append("phone", form.phone.trim());

      if (!editAgent) {
        formData.append("password", form.password);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      if (editAgent) {
        await api.put(`/agents/${editAgent.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast("Agent berhasil diperbarui", "success");
      } else {
        await api.post("/agents/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast("Agent berhasil dibuat", "success");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditAgent(null);
      setAvatarFile(null);
      setAvatarPreview(null);

      await fetchAgents();
    } catch (error) {
      console.error("Gagal menyimpan agent:", error);
      const data = error.response?.data;
      toast(firstApiError(data, "Gagal menyimpan agent."), "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || deleteLoading) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/agents/${deleteId}/`);
      toast("Agent berhasil dihapus", "success");
      setDeleteId(null);
      await fetchAgents();
    } catch (error) {
      console.error("Gagal menghapus agent:", error);
      toast(
        error.response?.data?.detail || "Gagal menghapus agent",
        "error"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-primary p-3 text-white">
            <UserPlus size={26} weight="bold" />
          </span>
          <div>
            <h1 className="text-xl font-bold">Agents</h1>
            <p className="text-sm text-slate-500">Kelola data agent QontakSales</p>
          </div>
        </div>

        <button onClick={openCreate} className={btnPrimary}>
          <Plus size={18} />
          Tambah Agent
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Total Agents", agents.length],
          ["Managers", agents.filter((a) => a.role === "MANAGER").length],
          ["Agents", agents.filter((a) => a.role === "AGENT").length],
        ].map(([label, value]) => (
          <div key={label} className={`${cardCls} p-5`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className={`${cardCls} p-5`}>
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner size="lg" />
            <p className="text-sm text-slate-500">Muat data agent...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <UserPlus size={40} />
            <h2 className="text-base font-semibold">Belum ada agent</h2>
            <p className="text-sm text-slate-500">
              Klik Tambah Agent buat nambah data.
            </p>
            <button onClick={openCreate} className={`${btnPrimary} mt-2`}>
              <Plus size={18} />
              Tambah Agent
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Agent</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Telepon</th>
                  <th className="py-2 pr-4 font-medium">Peran</th>
                  <th className="py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {agents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-app-border/60 last:border-0"
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={agent.avatar_url} name={`${agent.first_name} ${agent.last_name}`} />
                        <div>
                          <p className="font-medium">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-xs text-slate-500">@{agent.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">{agent.email}</td>
                    <td className="py-2.5 pr-4">{agent.phone || "-"}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          agent.role === "MANAGER"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {agent.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(agent)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-medium hover:bg-muted"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(agent.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-300 px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              count={agents.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editAgent ? "Edit Agent" : "Tambah Agent"}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-5">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar src={avatarPreview} name={`${form.first_name} ${form.last_name}`} size="xl" />
              <label className={`${btnOutline} h-8 cursor-pointer text-xs`}>
                <Camera size={16} />
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div>
              <label className={labelCls}>
                Username <span className="text-destructive">*</span>
              </label>
              <input
                name="username"
                className={inputCls}
                value={form.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                disabled={!!editAgent}
                required
              />
            </div>

            <div>
              <label className={labelCls}>
                Email <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={inputCls}
                value={form.email}
                onChange={handleChange}
                placeholder="agent@example.com"
                required
              />
            </div>

            {!editAgent && (
              <div>
                <label className={labelCls}>
                  Password <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className={inputCls}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Password minimal 8 karakter.
                </p>
              </div>
            )}

            <div>
              <label className={labelCls}>Nama Depan</label>
              <input
                name="first_name"
                className={inputCls}
                value={form.first_name}
                onChange={handleChange}
                placeholder="Nama depan"
              />
            </div>

            <div>
              <label className={labelCls}>Nama Belakang</label>
              <input
                name="last_name"
                className={inputCls}
                value={form.last_name}
                onChange={handleChange}
                placeholder="Nama belakang"
              />
            </div>

            <div>
              <label className={labelCls}>Nomor Telepon</label>
              <input
                name="phone"
                className={inputCls}
                value={form.phone}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-app-border px-5 py-4">
            <button
              type="button"
              className={btnOutline}
              onClick={() => setDialogOpen(false)}
              disabled={submitLoading}
            >
              Batal
            </button>
            <button type="submit" className={btnPrimary} disabled={submitLoading}>
              {submitLoading
                ? "Menyimpan..."
                : editAgent
                  ? "Simpan Perubahan"
                  : "Buat Agent"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => !deleteLoading && setDeleteId(null)}
        title="Hapus Agent?"
        maxW="max-w-sm"
      >
        <div className="p-5">
          <p className="text-sm">Apakah lo yakin mau menghapus agent ini?</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-app-border px-5 py-4">
          <button
            className={btnOutline}
            onClick={() => setDeleteId(null)}
            disabled={deleteLoading}>Batal</button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            <Trash size={16} />
            {deleteLoading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
