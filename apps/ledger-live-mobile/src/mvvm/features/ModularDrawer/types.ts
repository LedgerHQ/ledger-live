import { AccountLike, Account } from "@ledgerhq/types-live";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export const MODULAR_DRAWER_KEY = "modularDrawer";

export type ModularDrawerCompletionMode = "currency";
export type ModularDrawerPresentation = "drawer" | "embedded";

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
  presentation?: "drawer";
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onCurrencySelected?: never;
};

type CurrencyDrawerCompletion = {
  completionMode: "currency";
  presentation?: ModularDrawerPresentation;
  onAccountSelected?: never;
  onCurrencySelected: (currency: CryptoOrTokenCurrency | null) => void;
};

export type DrawerParams<TExtras extends object = DrawerExtras> = DrawerBaseParams &
  (AccountOrDeviceDrawerCompletion | CurrencyDrawerCompletion) &
  TExtras;

type AccountOrDeviceDrawerRemoteCompletion = {
  callbackId?: string;
  completionMode?: never;
  presentation?: "drawer";
};

type CurrencyDrawerRemoteCompletion = {
  callbackId?: string;
  completionMode: "currency";
  presentation?: ModularDrawerPresentation;
};

export type DrawerRemoteParams<TExtras extends object = DrawerExtras> = DrawerBaseParams &
  (AccountOrDeviceDrawerRemoteCompletion | CurrencyDrawerRemoteCompletion) &
  TExtras;

export type OpenDrawer<TExtras extends object = DrawerExtras> = (
  params?: DrawerParams<TExtras>,
) => void;
