export default function LoadingPopup({ open, message = "Loading..." }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[4px]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      style={{ touchAction: "none" }}
    >
      <div
        className="min-w-[220px] rounded-2xl border border-app-border bg-white px-10 py-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="spinner h-10 w-10 border-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
