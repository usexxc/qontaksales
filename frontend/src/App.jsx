import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AgentsPage from "./pages/AgentsPage";
import COAPage from "./pages/COAPage";
import CustomersPage from "./pages/CustomersPage";

import MainLayout from "./components/layout/MainLayout";
import AuthGuard from "./components/layout/AuthGuard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/agents" element={<AgentsPage />} />

          <Route path="/coa" element={<COAPage />} />

          <Route path="/customers" element={<CustomersPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}