import { useEffect, useRef, useState } from "react";
import type { ToolId } from "@devtools/registry";
import { STORAGE_KEY, serialize, deserialize, addToRecent } from "../utils/devToolsStorageUtils";

export function useDevToolsStorage(
  activeToolId: ToolId | undefined,
  setActiveToolId: (id: ToolId) => void,
): { recentToolIds: ToolId[] } {
  const [recentToolIds, setRecentToolIds] = useState<ToolId[]>([]);
  // undefined = effect has never run yet (initial mount), null/string = seen at least once
  const prevActiveToolIdRef = useRef<ToolId | null | undefined>(undefined);
  const recentToolIdsRef = useRef<ToolId[]>(recentToolIds);
  recentToolIdsRef.current = recentToolIds;

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
    if (prevActiveToolIdRef.current === undefined) {
      prevActiveToolIdRef.current = activeToolId ?? null;
      return;
    }
    prevActiveToolIdRef.current = activeToolId ?? null;

    if (!activeToolId) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          serialize({ activeToolId: null, recentToolIds: recentToolIdsRef.current }),
        );
      } catch {
        // ignore
      }
      return;
    }

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
