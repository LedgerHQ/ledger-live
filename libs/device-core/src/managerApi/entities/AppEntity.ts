import { Id } from "./Id";

export enum AppType {
  app = "app", // NB Legacy from v1, drop after we default to v2.
  currency = "currency",
  plugin = "plugin",
  tool = "tool",
  swap = "swap",
}

/** App is higher level on top of Application and ApplicationVersion
with all fields Live needs and in normalized form (but still serializable) */
export type AppEntity = {
  id: Id;
  name: string;
  displayName: string;
  version: string;
  currencyId: string | null | undefined;
  description: string | null | undefined;
  dateModified: string;
  icon: string;
  authorName: string | null | undefined;
  supportURL: string | null | undefined;
  contactURL: string | null | undefined;
  sourceURL: string | null | undefined;
  hash: string;
  perso: string;
  firmware: string;
  firmware_key: string;
  delete: string;
  delete_key: string;
  // we use names to identify an app
  dependencies: string[];
  bytes: number | null | undefined;
  warning: string | null | undefined;
  // -1 if coin not in marketcap, otherwise index in the tickers list of https://countervalues.api.live.ledger.com/tickers
  indexOfMarketCap: number;
  isDevTools: boolean;
  type: AppType;
};

export type ApplicationV2Entity = {
  versionId: Id;
  versionName: string;
  versionDisplayName: string;
  version: string;
  currencyId: string;
  description: string;
  applicationType: AppType;
  dateModified: string;
  icon: string;
  authorName: string;
  supportURL: string;
  contactURL: string;
  sourceURL: string;
  hash: string;
  perso: string;
  parentName: string | null;
  firmware: string;
  firmwareKey: string;
  delete: string;
  deleteKey: string;
  bytes: number;
  warning: string | null;
  isDevTools: boolean;
};
