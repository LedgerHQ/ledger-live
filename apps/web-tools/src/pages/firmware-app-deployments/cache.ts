import { CACHE_KEY } from "./constants";
import { isUsableMatrix } from "./logic";
import type { Matrix } from "./types";

export const readCache = (): Matrix | null => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null") as Matrix | null;
    return isUsableMatrix(cached) ? cached : null;
  } catch {
    // Denied storage or a corrupt entry — treat it as empty.
    return null;
  }
};

/** Returns an error message when the matrix could not be cached, `null` otherwise. */
export const writeCache = (value: Matrix): string | null => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
    return null;
  } catch (error) {
    const reason = error instanceof Error ? error.name : "unknown error";
    return `Could not cache locally (${reason}). Data will be refetched next load.`;
  }
};
