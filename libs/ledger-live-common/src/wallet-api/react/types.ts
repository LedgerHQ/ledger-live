import type { AccountLike } from "@ledgerhq/types-live";
import type { ServerConfig } from "@ledgerhq/wallet-api-server";
import type { WalletState } from "@ledgerhq/live-wallet/store";
import type { StateDB } from "../../hooks/useDBRaw";
import type { AppManifest, WalletAPICustomHandlers, DiscoverDB } from "../types";
import type { LiveAppManifest } from "../../platform/types";
import type { TrackingAPI } from "../tracking";
import type { UiHook } from "../handlers/types";

export type RecentlyUsedDB = StateDB<DiscoverDB, DiscoverDB["recentlyUsed"]>;
export type CacheBustedLiveAppsDB = StateDB<DiscoverDB, DiscoverDB["cacheBustedLiveApps"]>;
export type LocalLiveAppDB = StateDB<DiscoverDB, DiscoverDB["localLiveApp"]>;
export type CurrentAccountHistDB = StateDB<DiscoverDB, DiscoverDB["currentAccountHist"]>;
export type SetCurrentAccountHistDb = CurrentAccountHistDB[1];

export interface Categories {
  categories: string[];
  manifestsByCategories: Map<string, AppManifest[]>;
  selected: string;
  setSelected: (val: string) => void;
  reset: () => void;
}

export type CategoryId = Categories["selected"];

export interface LocalLiveApp {
  state: LiveAppManifest[];
  addLocalManifest: (manifest: LiveAppManifest) => void;
  removeLocalManifestById: (manifestId: string) => void;
  getLocalLiveAppManifestById: (manifestId: string) => LiveAppManifest | undefined;
}

export interface RecentlyUsed {
  data: RecentlyUsedManifest[];
  append: (manifest: AppManifest) => void;
  clear: () => void;
}

export type RecentlyUsedManifest = AppManifest & { usedAt: UsedAt };
export type UsedAt = {
  unit?: Intl.RelativeTimeFormatUnit;
  diff: number;
};

export interface DisclaimerRaw {
  onConfirm: (manifest: AppManifest, isChecked: boolean) => void;
  onSelect: (manifest: AppManifest) => void;
}

export type useWalletAPIServerOptions = {
  walletState: WalletState;
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
  config: ServerConfig;
  webviewHook: {
    reload: () => void;
    postMessage: (message: string) => void;
  };
  uiHook: Partial<UiHook>;
  customHandlers?: WalletAPICustomHandlers;
};
