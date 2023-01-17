export const MANAGER_TABS = {
  CATALOG: "CATALOG",
  INSTALLED_APPS: "INSTALLED_APPS",
} as const;

export type ManagerTab = keyof typeof MANAGER_TABS;
