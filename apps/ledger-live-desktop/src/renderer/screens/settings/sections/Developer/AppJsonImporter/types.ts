import type { AccountRaw } from "@ledgerhq/types-live";
import type { SettingsState } from "~/renderer/reducers/settings";

export type AccountRawEntry = {
  data: AccountRaw;
  version: number;
};

export type AppJsonData = {
  accounts?: AccountRawEntry[] | string;
  settings?: SettingsState;
};

export type AppJson = {
  data: AppJsonData;
};

export type ImportStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; accountCount: number; lastDeviceLabel: string | null }
  | { kind: "error"; message: string };
