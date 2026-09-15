import Modal from "@/components/ui/Modal";
import { btnPrimary } from "@/components/ui/form";

const Stat = ({ value, label, cls }) => (
  <div className={`rounded-lg p-3 text-center ${cls}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-80">{label}</p>
  </div>
);

export default function ImportResultModal({ result, onClose }) {
  return (
    <Modal open={!!result} onClose={onClose} title="Hasil Import" maxW="max-w-lg">
      {result && (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat value={result.created} label="Baru" cls="bg-emerald-50 text-emerald-700" />
            <Stat value={result.replaced} label="Ke-replace" cls="bg-amber-50 text-amber-700" />
            <Stat value={result.failed} label="Gagal" cls="bg-red-50 text-red-700" />
          </div>

          {result.errors?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Baris yang gagal:</p>
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-app-border text-sm">
                {result.errors.map((err) => (
                  <li
                    key={err.row}
                    className="border-b border-app-border/60 px-3 py-2 last:border-0"
                  >
                    <span className="font-medium">Baris {err.row}</span>{" "}
                    ({err.name}): {err.message}
                  </li>
                ))}
              </ul>
              {result.errors_truncated && (
                <p className="mt-1 text-xs text-slate-500">
                  ...dan sisa error lainnya tidak ditampilkan.
                </p>
              )}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" className={btnPrimary} onClick={onClose}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
