export const FEE_PRESETS = ["slow", "fast"] as const;

export type FeePreset = (typeof FEE_PRESETS)[number];
