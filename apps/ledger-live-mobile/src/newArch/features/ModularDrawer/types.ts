import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export type ModularDrawerNavigationParams = {
  isFromModularDrawer?: boolean;
  asset: CryptoOrTokenCurrency | null;
  network: CryptoOrTokenCurrency | null;
  step: ModularDrawerStep;
};

export const MODULAR_DRAWER_KEY = "modularDrawer";
