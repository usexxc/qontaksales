import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthGuard() {
  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("user_role");
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace />;
  if (role === "AGENT" && location.pathname === "/agents") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
