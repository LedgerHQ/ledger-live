import { AccountLike, Account } from "@ledgerhq/types-live";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AssetCategory } from "@domain/api-aggregated-assets";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export type DisabledItemTooltip = Readonly<{
  title: string;
  content: string;
}>;

export type DisabledItemsTooltip = Readonly<{
  asset: (assetName: string) => DisabledItemTooltip;
  network: (networkName: string, assetName: string) => DisabledItemTooltip;
  onPress: (tooltip: DisabledItemTooltip) => void;
}>;

export const MODULAR_DRAWER_KEY = "modularDrawer";

export type ModularDrawerCompletionMode = "currency";
export type ModularDrawerPresentation = "drawer" | "embedded";

export type DrawerExtras = {
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
};

export type DrawerBaseParams = {
  currencies?: string[];
  categories?: AssetCategory[];
  enableAccountSelection?: boolean;
  flow?: string;
  source?: string;
  areCurrenciesFiltered?: boolean;
  selectableNetworkIds?: string[];
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
  (AccountOrDeviceDrawerCompletion | CurrencyDrawerCompletion) & {
    onCancel?: () => void;
  } & TExtras;

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
  (AccountOrDeviceDrawerRemoteCompletion | CurrencyDrawerRemoteCompletion) & {
    cancelCallbackId?: string;
  } & TExtras;

export type OpenDrawer<TExtras extends object = DrawerExtras> = (
  params?: DrawerParams<TExtras>,
) => void;
