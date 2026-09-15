// semua hal yang cuma "data", dipakai oleh page & komponennya

export const STATUS_BADGE = {
  PROSPECT: "bg-amber-100 text-amber-700",
  CUSTOMER: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-600",
};

export const emptyForm = {
  name: "",
  company_name: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  province: "",
  regency: "",
  district: "",
  village: "",
  status: "PROSPECT",
  agent: "",
  notes: "",
};

// urut dari hulu ke hilir: negara, provinsi, kabupaten, kecamatan, kelurahan
export const WILAYAH = ["country", "province", "regency", "district", "village"];

// cara manggil daftar anak tiap jenjang; argumennya id induknya
export const REGION_URL = {
  province: (id) => `/regions/provinces/?country=${id}`,
  regency: (id) => `/regions/regencies/?province=${id}`,
  district: (id) => `/regions/districts/?regency=${id}`,
  village: (id) => `/regions/villages/?district=${id}`,
};

// 4 dropdown di bawah negara, tinggal di-render map
export const REGION_FIELDS = [
  { level: "province", label: "Provinsi", parent: "negara" },
  { level: "regency", label: "Kabupaten / Kota", parent: "provinsi" },
  { level: "district", label: "Kecamatan", parent: "kabupaten/kota" },
  { level: "village", label: "Kelurahan / Desa", parent: "kecamatan" },
];

export const emptyChoices = {
  country: [],
  province: [],
  regency: [],
  district: [],
  village: [],
};
