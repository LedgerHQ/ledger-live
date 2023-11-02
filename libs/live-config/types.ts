export type Config<T> = {
  name: string;
  tyoe: string | number | T;
};

export const config = {
  appName: "Ledger Live",
} as const;

export type ConfigKey = keyof typeof config;
