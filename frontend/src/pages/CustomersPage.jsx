import { useEffect, useRef, useState } from "react";
import { Plus, FileArrowUp, FileArrowDown, DownloadSimple } from "@phosphor-icons/react";
import api, { getAll } from "@/services/api";
import { toast } from "@/components/ui/toast";
import { btnPrimary, btnOutline } from "@/components/ui/form";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerTable from "@/components/customers/CustomerTable";
import ImportResultModal from "@/components/customers/ImportResultModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fileInputRef = useRef(null);
  const exportRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setCustomers(await getAll("/customers/"));
    } catch (error) {
      console.error("Gagal mengambil customer:", error);
      toast("Gagal mengambil customer", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    getAll("/agents/").then(setAgents).catch(() => {});
    api.get("/regions/countries/").then((res) => setCountries(res.data)).catch(() => {});
  }, []);

  // tutup dropdown export kalau klik di luar
  useEffect(() => {
    if (!exportOpen) return;
    const close = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [exportOpen]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (customer) => {
    setEditing(customer);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  // download file dari backend (blob) + nama file + tanggal hari ini
  const downloadExport = async (type) => {
    setExportOpen(false);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await api.get(`/customers/export/?type=${type}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer-${today}.${type}`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Customer berhasil diexport ke ${type.toUpperCase()}`, "success");
    } catch (error) {
      console.error("Gagal export customer:", error);
      toast("Gagal export customer", "error");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setImporting(true);
      const data = new FormData();
      data.append("file", file);
      const res = await api.post("/customers/import/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      await fetchCustomers();
    } catch (error) {
      console.error("Import gagal:", error);
      toast(error.response?.data?.detail || "Import gagal.", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data customer perusahaan
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen((open) => !open)}
              className={btnOutline}
              title="Export data customer"
            >
              <DownloadSimple size={18} />
              Export
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-44 overflow-hidden rounded-lg border border-app-border bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => downloadExport("xlsx")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-muted"
                >
                  <FileArrowDown size={16} />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => downloadExport("csv")}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-muted"
                >
                  <FileArrowDown size={16} />
                  CSV (.csv)
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={btnOutline}
          >
            <FileArrowUp size={18} />
            {importing ? "Mengimpor..." : "Import File"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={handleImportFile}
          />

          <button type="button" onClick={openAdd} className={btnPrimary}>
            <Plus size={20} />
            Tambah Customer
          </button>
        </div>
      </div>

      {formOpen && (
        <CustomerForm
          editing={editing}
          agents={agents}
          countries={countries}
          onDone={async () => {
            closeForm();
            await fetchCustomers();
          }}
        />
      )}

      <CustomerTable
        customers={customers}
        loading={loading}
        onEdit={openEdit}
        onChanged={fetchCustomers}
      />

      <ImportResultModal
        result={importResult}
        onClose={() => setImportResult(null)}
      />
    </div>
  );
}
