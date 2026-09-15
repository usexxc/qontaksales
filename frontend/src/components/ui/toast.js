const COLORS = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
};

function ensureContainer() {
  let el = document.getElementById("qontak-toast-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "qontak-toast-root";
    el.className =
      "fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none";
    document.body.appendChild(el);
  }
  return el;
}

export function toast(message, type = "success", duration = 3000) {
  const container = ensureContainer();
  const item = document.createElement("div");
  item.className = `${
    COLORS[type] || COLORS.success
  } text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg max-w-xs opacity-0 translate-x-2 transition-all duration-200`;
  item.textContent = message;
  container.appendChild(item);
  requestAnimationFrame(() =>
    item.classList.remove("opacity-0", "translate-x-2")
  );
  setTimeout(() => {
    item.classList.add("opacity-0", "translate-x-2");
    setTimeout(() => item.remove(), 250);
  }, duration);
}
