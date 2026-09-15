import { useEffect, useState } from "react";
import {
  cardCls,
  inputCls,
  labelCls,
  btnPrimary,
  btnOutline,
} from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import api from "@/services/api";
import { toTitle } from "@/services/format";
import { useRegionCascade } from "./useRegionCascade";
import { REGION_FIELDS, WILAYAH, emptyForm } from "./constants";

const REGION_LEVELS = ["province", "regency", "district", "village"];

export default function CustomerForm({
  editing,
  agents,
  countries,
  onDone,
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { choices, loading, fetchChildren, resetChoices } = useRegionCascade();

  // pas dibuka buat edit: isi form + muat pilihan dropdown sejalur rantai wilayahnya
  useEffect(() => {
    if (!editing) return;

    const country = countries[0];
    const countryId = editing.province && country ? String(country.id) : "";

    setForm({
      ...emptyForm,
      name: editing.name || "",
      company_name: editing.company_name || "",
      email: editing.email || "",
      phone: editing.phone || "",
      address: editing.address || "",
      country: countryId,
      province: editing.province ? String(editing.province) : "",
      regency: editing.regency ? String(editing.regency) : "",
      district: editing.district ? String(editing.district) : "",
      village: editing.village ? String(editing.village) : "",
      status: editing.status || "PROSPECT",
      agent: editing.agent ? String(editing.agent) : "",
      notes: editing.notes || "",
    });

    const chain = [
      ["country", countryId],
      ["province", editing.province],
      ["regency", editing.regency],
      ["district", editing.district],
    ];
    (async () => {
      for (const [level, id] of chain) {
        if (id) await fetchChildren(level, id);
      }
    })();
  }, [editing, countries, fetchChildren]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const level = WILAYAH.indexOf(name);

    if (level === -1) {
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // ganti di satu jenjang = reset semua jenjang di bawahnya, lalu muat anak baru
    const reset = Object.fromEntries(
      WILAYAH.slice(level + 1).map((l) => [l, ""])
    );
    setForm((prev) => ({ ...prev, [name]: value, ...reset }));
    fetchChildren(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast("Nama customer wajib diisi.", "warning");
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: form.name.trim(),
        company_name: form.company_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };
      // id wilayah dari dropdown berupa string, backend maunya number/null
      for (const level of REGION_LEVELS) {
        data[level] = form[level] ? Number(form[level]) : null;
      }
      if (form.agent) {
        data.agent = Number(form.agent);
      }

      if (editing) {
        await api.put(`/customers/${editing.id}/`, data);
        toast("Customer berhasil diperbarui", "success");
      } else {
        await api.post("/customers/", data);
        toast("Customer berhasil ditambahkan", "success");
      }
      onDone();
    } catch (error) {
      console.error("Gagal menyimpan customer:", error);
      const fieldError =
        error.response?.data?.regency?.[0] ||
        error.response?.data?.district?.[0];
      toast(
        fieldError ||
          error.response?.data?.detail ||
          "Gagal menyimpan customer.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${cardCls} mb-6 p-6`}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {editing ? "Edit Customer" : "Tambah Customer"}
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Customer</label>
            <input
              name="name"
              className={inputCls}
              value={form.name}
              onChange={handleChange}
              placeholder="Nama customer"
            />
          </div>

          <div>
            <label className={labelCls}>Nama Perusahaan</label>
            <input
              name="company_name"
              className={inputCls}
              value={form.company_name}
              onChange={handleChange}
              placeholder="Nama perusahaan"
            />
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              name="email"
              className={inputCls}
              value={form.email}
              onChange={handleChange}
              placeholder="customer@email.com"
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

          <div>
            <label className={labelCls}>Status</label>
            <select
              name="status"
              className={inputCls}
              value={form.status}
              onChange={handleChange}
            >
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Agent</label>
            <select
              name="agent"
              className={inputCls}
              value={form.agent}
              onChange={handleChange}
            >
              <option value="">Pilih Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {(agent.first_name || agent.username) +
                    (agent.last_name ? ` ${agent.last_name}` : "")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Alamat</label>
            <textarea
              name="address"
              className={`${inputCls} h-auto min-h-[80px] py-2`}
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat customer"
            />
          </div>

          <div>
            <label className={labelCls}>Negara</label>
            <select
              name="country"
              className={inputCls}
              value={form.country}
              onChange={handleChange}
            >
              <option value="">Pilih Negara</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {REGION_FIELDS.map(({ level, label, parent }) => {
            const parentLevel = WILAYAH[WILAYAH.indexOf(level) - 1];
            const busy = loading[level];
            const parentTerpilih = Boolean(form[parentLevel]);
            return (
              <div key={level}>
                <label className={labelCls}>{label}</label>
                <select
                  name={level}
                  className={inputCls}
                  value={form[level]}
                  onChange={handleChange}
                  disabled={!parentTerpilih || busy}
                >
                  <option value="">
                    {busy
                      ? "Memuat..."
                      : parentTerpilih
                        ? `Pilih ${label}`
                        : `Pilih ${parent} dulu`}
                  </option>
                  {choices[level].map((item) => (
                    <option key={item.id} value={item.id}>
                      {toTitle(item.name)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          <div className="md:col-span-2">
            <label className={labelCls}>Catatan</label>
            <textarea
              name="notes"
              className={`${inputCls} h-auto min-h-[80px] py-2`}
              value={form.notes}
              onChange={handleChange}
              placeholder="Catatan tambahan"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={btnOutline}
            onClick={() => {
              resetChoices();
              onDone();
            }}
          >
            Batal
          </button>
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving
              ? "Menyimpan..."
              : editing
                ? "Simpan Perubahan"
                : "Simpan Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
