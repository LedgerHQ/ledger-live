import { useCallback } from "react";
import type { CacheBustedLiveAppsdDB } from "./types";

export function useCacheBustedLiveApps([cacheBustedLiveAppsDb, setState]: CacheBustedLiveAppsdDB) {
  const getLatest = useCallback(
    (manifestId: string) => {
      return cacheBustedLiveAppsDb?.[manifestId];
    },
    [cacheBustedLiveAppsDb],
  );
  const edit = useCallback(
    (manifestId: string, cacheBustingId: number) => {
      const _cacheBustedLiveAppsDb = {
        ...cacheBustedLiveAppsDb,
        [manifestId]: cacheBustingId,
        init: 1,
      };
      setState(state => {
        const newstate = { ...state, cacheBustedLiveApps: _cacheBustedLiveAppsDb };
        return newstate;
      });
    },
    [setState, cacheBustedLiveAppsDb],
  );
  return { getLatest, edit };
}
