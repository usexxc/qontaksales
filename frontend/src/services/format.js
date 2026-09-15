// fungsi kecil yang kepake di lebih dari satu halaman

export const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

// "KABUPATEN BANDUNG" -> "Kabupaten Bandung"
export const toTitle = (value) =>
  (value || "")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

// DRF ngasih error per-field, bentuknya { field: ["pesan", ...] }.
// Tinggal ambil pesan pertama buat di-toast.
export const firstApiError = (data, fallback) => {
  const first = Object.values(data || {})[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === "string") return first;
  return data?.detail || fallback;
};
