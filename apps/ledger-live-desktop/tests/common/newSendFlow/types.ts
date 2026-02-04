export const FEE_PRESETS = ["slow", "medium", "fast"] as const;

export type FeePreset = (typeof FEE_PRESETS)[number];
