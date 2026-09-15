export default function Spinner({ size = "lg", className = "" }) {
  const s =
    size === "xl" ? "h-10 w-10 border-4" : size === "lg" ? "h-8 w-8 border-[3px]" : "h-5 w-5 border-2";
  return (
    <span
      className={`spinner inline-block text-primary ${s} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
