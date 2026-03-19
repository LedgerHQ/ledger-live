import { useMemo, useCallback } from "react";
import { intervalToDuration } from "date-fns";
import { MAX_RECENTLY_USED_LENGTH } from "../constants";
import type { AppManifest } from "../types";
import type { RecentlyUsed, RecentlyUsedManifest, UsedAt, RecentlyUsedDB } from "./types";

function calculateTimeDiff(usedAt: string): UsedAt {
  const start = new Date();
  const end = new Date(usedAt);
  const interval = intervalToDuration({ start, end });
  const units: Intl.RelativeTimeFormatUnit[] = [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
  ];
  let timeDiff: UsedAt = { unit: undefined, diff: 0 };

  for (const unit of units) {
    if (interval[unit] > 0) {
      timeDiff = { unit, diff: interval[unit] };
      break;
    }
  }

  return timeDiff;
}

export function useRecentlyUsed(
  manifests: AppManifest[],
  [recentlyUsedManifestsDb, setState]: RecentlyUsedDB,
): RecentlyUsed {
  const data = useMemo(
    () =>
      recentlyUsedManifestsDb
        .map(recentlyUsed => {
          const res = manifests.find(manifest => manifest.id === recentlyUsed.id);
          return res
            ? {
                ...res,
                usedAt: calculateTimeDiff(recentlyUsed.usedAt),
              }
            : undefined;
        })
        .filter((manifest): manifest is RecentlyUsedManifest => manifest !== undefined),
    [recentlyUsedManifestsDb, manifests],
  );
  const append = useCallback(
    (manifest: AppManifest) => {
      setState(state => {
        const index = state.recentlyUsed.findIndex(({ id }) => id === manifest.id);

        if (index === 0) {
          return {
            ...state,
            recentlyUsed: [
              { ...state.recentlyUsed[0], usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(1),
            ],
          };
        }

        if (index !== -1) {
          return {
            ...state,
            recentlyUsed: [
              { id: manifest.id, usedAt: new Date().toISOString() },
              ...state.recentlyUsed.slice(0, index),
              ...state.recentlyUsed.slice(index + 1),
            ],
          };
        }

        return {
          ...state,
          recentlyUsed:
            state.recentlyUsed.length >= MAX_RECENTLY_USED_LENGTH
              ? [
                  { id: manifest.id, usedAt: new Date().toISOString() },
                  ...state.recentlyUsed.slice(0, -1),
                ]
              : [{ id: manifest.id, usedAt: new Date().toISOString() }, ...state.recentlyUsed],
        };
      });
    },
    [setState],
  );

  const clear = useCallback(() => {
    setState(state => ({ ...state, recentlyUsed: [] }));
  }, [setState]);

  return { data, append, clear };
}
