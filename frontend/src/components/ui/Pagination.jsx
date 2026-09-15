import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export default function Pagination({
  page = 1,
  count = 0,
  pageSize = 25,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const btn =
    "inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-4 py-3">
      <p className="text-xs text-slate-500">
        Menampilkan {from}–{to} dari {count} data
      </p>
      <div className="flex items-center gap-2">
        <button
          className={btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <CaretLeft size={14} />
          Prev
        </button>
        <span className="text-xs font-medium">
          Hal {page} / {totalPages}
        </span>
        <button
          className={btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <CaretRight size={14} />
        </button>
      </div>
    </div>
  );
}
