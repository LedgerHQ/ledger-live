import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { ReactNode } from "react";

export type AssetType = {
  name: string;
  ticker: string;
  id: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  numberOfNetworks?: number;
  assetId?: string;
  shouldDisplayId?: boolean;
};

export const NAVIGATION_DIRECTION = {
  FORWARD: "FORWARD",
  BACKWARD: "BACKWARD",
} as const;

export type NavigationDirection = (typeof NAVIGATION_DIRECTION)[keyof typeof NAVIGATION_DIRECTION];

export const MODULAR_DIALOG_STEP = {
  ASSET_SELECTION: "ASSET_SELECTION",
  NETWORK_SELECTION: "NETWORK_SELECTION",
  ACCOUNT_SELECTION: "ACCOUNT_SELECTION",
} as const;

export type ModularDialogStep = (typeof MODULAR_DIALOG_STEP)[keyof typeof MODULAR_DIALOG_STEP];

export type ModularDialogFlowManagerProps = {
  currencies: string[];
  dialogConfiguration?: EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onClose?: () => void;
};
