import { useState } from "react";
import { Pencil, Trash, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import api from "@/services/api";
import Spinner from "@/components/ui/Spinner";
import Pagination from "@/components/ui/Pagination";
import { cardCls, inputCls } from "@/components/ui/form";
import { toTitle } from "@/services/format";
import { STATUS_BADGE } from "./constants";

const PAGE_SIZE = 25;

export default function CustomerTable({
  customers,
  loading,
  onEdit,
  onChanged,
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus customer ini?")) return;

    try {
      await api.delete(`/customers/${id}/`);
      toast("Customer berhasil dihapus", "success");
      onChanged();
    } catch (error) {
      console.error("Gagal menghapus customer:", error);
      toast(
        error.response?.data?.detail || "Gagal menghapus customer.",
        "error"
      );
    }
  };

  const filtered = customers.filter((customer) => {
    const keyword = search.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(keyword) ||
      customer.company_name?.toLowerCase().includes(keyword) ||
      customer.email?.toLowerCase().includes(keyword) ||
      customer.phone?.toLowerCase().includes(keyword) ||
      customer.regency_name?.toLowerCase().includes(keyword) ||
      customer.province_name?.toLowerCase().includes(keyword) ||
      customer.country_name?.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className={`${cardCls} overflow-hidden`}>
      <div className="border-b border-app-border p-4">
        <div className="relative w-full max-w-[400px]">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className={`${inputCls} pl-10`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari customer..."
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 py-10">
          <p className="font-semibold">Tidak ada data customer</p>
          <p className="text-sm text-slate-500">
            Klik Tambah Customer untuk menambahkan data.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border text-left text-slate-500">
                <th className="px-4 py-2.5 font-medium">Nama</th>
                <th className="px-4 py-2.5 font-medium">Perusahaan</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Telepon</th>
                <th className="px-4 py-2.5 font-medium">Wilayah</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-4 py-2.5 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((customer) => {
                const wilayah = [
                  customer.village_name,
                  customer.district_name,
                  customer.regency_name,
                  customer.province_name,
                  customer.country_name,
                ]
                  .filter(Boolean)
                  .map(toTitle)
                  .join(", ");
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-app-border/60 last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        {customer.avatar_url ? (
                          <img
                            src={customer.avatar_url}
                            alt={customer.name}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground/50">
                            {(customer.name || "?")[0].toUpperCase()}
                          </span>
                        )}
                        {customer.name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{customer.company_name || "-"}</td>
                    <td className="px-4 py-2.5">{customer.email || "-"}</td>
                    <td className="px-4 py-2.5">{customer.phone || "-"}</td>
                    <td className="px-4 py-2.5">{wilayah || "-"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_BADGE[customer.status] ||
                          "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{customer.agent_name || "-"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 hover:bg-muted"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                          aria-label="Hapus"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            page={safePage}
            count={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
