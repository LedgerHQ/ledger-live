/**
 * Parse an integer from process.env[key], or return default.
 * Explicitly treats undefined, empty string, and non-numeric values as invalid.
 */
export const intFromEnv = (key: string, def: number): number => {
  const v = process.env[key];
  if (v !== undefined && v !== "" && !Number.isNaN(Number(v))) return parseInt(v, 10);
  return def;
};

/**
 * Window min dimensions. Single source of truth for main (window-lifecycle) and renderer (layout).
 * Overridable via LEDGER_MIN_WIDTH / LEDGER_MIN_HEIGHT env.
 */
export const MIN_WIDTH = intFromEnv("LEDGER_MIN_WIDTH", 1024);
export const MIN_HEIGHT = intFromEnv("LEDGER_MIN_HEIGHT", 700);
