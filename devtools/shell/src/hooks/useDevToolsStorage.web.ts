import { useEffect, useState } from "react";
import { STORAGE_KEY, serialize, deserialize, addToRecent } from "../utils/devToolsStorageUtils";

export function useDevToolsStorage(
  activeToolId: string | undefined,
  setActiveToolId: (id: string) => void,
): { recentToolIds: string[] } {
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { activeToolId: stored, recentToolIds: storedRecents } = deserialize(raw);
        if (stored) setActiveToolId(stored);
        if (storedRecents) setRecentToolIds(storedRecents);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!activeToolId) return;
    setRecentToolIds(prev => {
      const next = addToRecent(prev, activeToolId);
      if (next === prev) return prev;
      try {
        localStorage.setItem(STORAGE_KEY, serialize({ activeToolId, recentToolIds: next }));
      } catch {
        // ignore
      }
      return next;
    });
  }, [activeToolId]);

  return { recentToolIds };
}
