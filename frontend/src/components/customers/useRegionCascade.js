import { useCallback, useState } from "react";
import api from "@/services/api";
import { REGION_URL, WILAYAH, emptyChoices } from "./constants";

// state buat dropdown wilayah berjenjang: pilihan tiap level + status muatnya
export function useRegionCascade() {
  const [choices, setChoices] = useState(emptyChoices);
  const [loading, setLoading] = useState({});

  const nextLevel = (level) => WILAYAH[WILAYAH.indexOf(level) + 1];

  // useCallback biar fungsi ini gak "baru" tiap render, enak buat deps useEffect
  const fetchChildren = useCallback(async (level, parentId) => {
    const child = nextLevel(level);
    if (!child) return;

    if (!parentId) {
      setChoices((prev) => ({ ...prev, [child]: [] }));
      return;
    }

    setLoading((prev) => ({ ...prev, [child]: true }));
    try {
      const res = await api.get(REGION_URL[child](parentId));
      setChoices((prev) => ({ ...prev, [child]: res.data }));
    } catch (error) {
      console.error(`Gagal mengambil ${child}:`, error);
      setChoices((prev) => ({ ...prev, [child]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [child]: false }));
    }
  }, []);

  // reset semua pilihan, misal abis dialog ditutup
  const resetChoices = () => {
    setChoices(emptyChoices);
    setLoading({});
  };

  return { choices, loading, fetchChildren, resetChoices };
}
