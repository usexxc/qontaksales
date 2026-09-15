import { X } from "@phosphor-icons/react";

export default function Modal({ open, onClose, title, children, maxW = "max-w-md" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`my-4 w-full ${maxW} rounded-xl border border-app-border bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-muted"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
