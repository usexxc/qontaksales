// Kelas Tailwind bersama buat form & kartu, biar konsisten antar halaman.
export const inputCls =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-100 disabled:text-slate-400";

export const labelCls = "mb-1.5 block text-sm font-medium text-foreground";

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-secondary disabled:opacity-60";

export const btnOutline =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60";

export const btnDanger =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60";

export const cardCls =
  "rounded-xl border border-app-border bg-white shadow-sm";
