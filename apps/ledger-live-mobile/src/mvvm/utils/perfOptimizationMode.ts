import mmkvStorageWrapper from "LLM/storage/mmkvStorageWrapper";

export const PERF_OPTIMIZATION_MODES = ["full", "getcomponent", "none"] as const;
export type PerfOptimizationMode = (typeof PERF_OPTIMIZATION_MODES)[number];

const STORAGE_KEY = "debug.perfOptimizationMode";

function isJest(): boolean {
  return typeof process !== "undefined" && Boolean(process.env.JEST_WORKER_ID);
}

export function getPerfOptimizationMode(): PerfOptimizationMode {
  if (isJest()) {
    return "full";
  }
  const stored = mmkvStorageWrapper.get<PerfOptimizationMode>(STORAGE_KEY);
  if (stored === "full" || stored === "getcomponent" || stored === "none") {
    return stored;
  }
  return "full";
}

export function setPerfOptimizationMode(mode: PerfOptimizationMode): void {
  mmkvStorageWrapper.save(STORAGE_KEY, mode);
}

export function isGetComponentEnabled(): boolean {
  return getPerfOptimizationMode() !== "none";
}

export function isAccountWorkletEnabled(): boolean {
  return getPerfOptimizationMode() === "full";
}
