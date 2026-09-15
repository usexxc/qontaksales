import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/token/refresh/`,
            { refresh: refreshToken }
          );
          localStorage.setItem("access_token", res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      } else {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// narik semua halaman dari endpoint yang kepaginasian (DRF),
// soalnya kalau cuma satu request yang kebawa cuma 25 item pertama
export async function getAll(url, params = {}) {
  const all = [];
  let page = 1;
  for (let i = 0; i < 50; i++) {
    const res = await api.get(url, { params: { ...params, page } });
    const data = res.data;
    if (Array.isArray(data)) {
      all.push(...data);
      break;
    }
    all.push(...(data.results || []));
    if (!data.next) break;
    page += 1;
  }
  return all;
}
