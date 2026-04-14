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

export type FailedAccountEntry = {
  currencyId: string;
  accountName: string | undefined;
  reason: string;
};

export type ImportStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; fileName: string; accountCount: number; failedEntries: FailedAccountEntry[] }
  | { kind: "error"; message: string };
