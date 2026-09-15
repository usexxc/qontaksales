import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash,
  ArrowClockwise,
} from "@phosphor-icons/react";
import api, { getAll } from "@/services/api";
import { rupiah } from "@/services/format";
import { toast } from "@/components/ui/toast";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import {
  cardCls,
  inputCls,
  labelCls,
  btnPrimary,
  btnOutline,
} from "@/components/ui/form";

const KATEGORI = ["Aset", "Liabilitas", "Ekuitas", "Pendapatan", "Beban"];

const emptyForm = {
  kode: "",
  nama: "",
  kategori: "Aset",
  saldo: "",
};

export default function COAPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const fetchCOA = async () => {
    try {
      setLoading(true);
      const response = await getAll("/coa/");
      setItems(response);
    } catch (error) {
      console.error(error);
      toast("Gagal mengambil data COA", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCOA();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      kode: item.kode || "",
      nama: item.nama || "",
      kategori: item.kategori || "Aset",
      saldo: item.saldo || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.kode || !form.nama) {
      toast("Kode dan nama akun wajib diisi", "warning");
      return;
    }

    try {
      setSaving(true);

      const data = {
        kode: form.kode,
        nama: form.nama,
        kategori: form.kategori,
        saldo: form.saldo || 0,
      };

      if (editing) {
        await api.put(`/coa/${editing.id}/`, data);
        toast("COA berhasil diperbarui", "success");
      } else {
        await api.post("/coa/", data);
        toast("COA berhasil ditambahkan", "success");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditing(null);

      await fetchCOA();
    } catch (error) {
      console.error(error);
      const message =
        error.response?.data?.kode?.[0] ||
        error.response?.data?.detail ||
        "Data COA gagal disimpan";
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const yakin = window.confirm("Yakin ingin menghapus akun COA ini?");
    if (!yakin) return;

    try {
      await api.delete(`/coa/${id}/`);
      toast("COA berhasil dihapus", "success");
      await fetchCOA();
    } catch (error) {
      console.error(error);
      toast("Gagal menghapus COA", "error");
    }
  };

  const totalSaldo = items.reduce(
    (total, item) => total + Number(item.saldo || 0),
    0
  );

  const totalKategori = new Set(items.map((item) => item.kategori)).size;

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="xl" />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola daftar akun dan saldo perusahaan.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={fetchCOA} className={btnOutline}>
            <ArrowClockwise size={17} />
            Refresh
          </button>
          <button onClick={openCreate} className={btnPrimary}>
            <Plus size={17} />
            Tambah COA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Total Akun", items.length],
          ["Total Saldo", rupiah(totalSaldo)],
          ["Kategori", totalKategori],
        ].map(([label, value]) => (
          <div key={label} className={`${cardCls} p-5`}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className={cardCls}>
        <div className="px-5 pb-2 pt-5">
          <h2 className="text-base font-semibold">Daftar COA</h2>
          <p className="mt-1 text-sm text-slate-500">{items.length} akun terdaftar</p>
        </div>

        <div className="overflow-x-auto p-5 pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border text-left text-slate-500">
                <th className="py-2 pr-4 font-medium">Kode</th>
                <th className="py-2 pr-4 font-medium">Nama Akun</th>
                <th className="py-2 pr-4 font-medium">Kategori</th>
                <th className="py-2 pr-4 font-medium">Saldo</th>
                <th className="py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <p className="py-10 text-center text-slate-500">
                      Belum ada data COA.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => (
                  <tr key={item.id} className="border-b border-app-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-bold">{item.kode}</td>
                    <td className="py-2.5 pr-4">{item.nama}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{rupiah(item.saldo)}</td>
                    <td className="py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs font-medium hover:bg-muted"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-red-300 px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash size={13} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          count={items.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Edit COA" : "Tambah COA"}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-5">
            <div>
              <label className={labelCls}>
                Kode Akun <span className="text-destructive">*</span>
              </label>
              <input
                className={inputCls}
                value={form.kode}
                onChange={(e) => setForm({ ...form, kode: e.target.value })}
                placeholder="Contoh: 1001"
              />
            </div>
            <div>
              <label className={labelCls}>
                Nama Akun <span className="text-destructive">*</span>
              </label>
              <input
                className={inputCls}
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Kas"
              />
            </div>
            <div>
              <label className={labelCls}>
                Kategori <span className="text-destructive">*</span>
              </label>
              <select
                className={inputCls}
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              >
                {KATEGORI.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Saldo Awal</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={form.saldo}
                onChange={(e) => setForm({ ...form, saldo: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-app-border px-5 py-4">
            <button
              type="button"
              className={btnOutline}
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
