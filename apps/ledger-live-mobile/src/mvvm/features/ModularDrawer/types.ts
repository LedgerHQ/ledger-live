import { AccountLike, Account } from "@ledgerhq/types-live";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export const MODULAR_DRAWER_KEY = "modularDrawer";

export type ModularDrawerCompletionMode = "currency";

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
  uiUseCase?: string;
};

type AccountOrDeviceDrawerCompletion = {
  completionMode?: never;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onCurrencySelected?: never;
};

type CurrencyDrawerCompletion = {
  completionMode: "currency";
  onAccountSelected?: never;
  onCurrencySelected: (currency: CryptoOrTokenCurrency | null) => void;
};

export type DrawerParams<TExtras extends object = DrawerExtras> = DrawerBaseParams &
  (AccountOrDeviceDrawerCompletion | CurrencyDrawerCompletion) &
  TExtras;

export type DrawerRemoteParams<TExtras extends object = DrawerExtras> = DrawerBaseParams & {
  callbackId?: string;
  completionMode?: ModularDrawerCompletionMode;
} & TExtras;

export type OpenDrawer<TExtras extends object = DrawerExtras> = (
  params?: DrawerParams<TExtras>,
) => void;
