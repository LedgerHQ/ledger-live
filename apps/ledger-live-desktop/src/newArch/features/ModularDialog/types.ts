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

export const MODULAR_DRAWER_STEP = {
  ASSET_SELECTION: "ASSET_SELECTION",
  NETWORK_SELECTION: "NETWORK_SELECTION",
  ACCOUNT_SELECTION: "ACCOUNT_SELECTION",
} as const;

export type ModularDrawerStep = (typeof MODULAR_DRAWER_STEP)[keyof typeof MODULAR_DRAWER_STEP];

export type ModularDrawerFlowManagerProps = {
  currencies: string[];
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  onClose?: () => void;
};
