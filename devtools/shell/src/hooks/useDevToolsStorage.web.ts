import { useEffect } from "react";
import { STORAGE_KEY, serialize, deserialize } from "./devToolsStorageUtils";

export function useDevToolsStorage(
  activeToolId: string | undefined,
  setActiveToolId: (id: string) => void,
): void {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { activeToolId: stored } = deserialize(raw);
        if (stored) setActiveToolId(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize({ activeToolId: activeToolId ?? null }));
    } catch {
      // ignore
    }
  }, [activeToolId]);
}
