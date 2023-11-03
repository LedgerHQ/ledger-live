export const config = {
  appName: "Ledger Live",
} as const;

export type ConfigKey = keyof typeof config;
