import { AccountLike, Account } from "@ledgerhq/types-live";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export const MODULAR_DRAWER_KEY = "modularDrawer";

export type DrawerExtras = {
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
};

export type DrawerBaseParams = {
  currencies?: string[];
  enableAccountSelection?: boolean;
  flow?: string;
  source?: string;
  areCurrenciesFiltered?: boolean;
  useCase?: string;
};

export type DrawerParams<TExtras extends object = DrawerExtras> = DrawerBaseParams & {
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
} & TExtras;

export type DrawerRemoteParams<TExtras extends object = DrawerExtras> = DrawerBaseParams & {
  callbackId?: string;
} & TExtras;

export type OpenDrawer<TExtras extends object = DrawerExtras> = (
  params?: DrawerParams<TExtras>,
) => void;
