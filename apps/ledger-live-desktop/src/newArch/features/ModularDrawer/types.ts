import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";

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
  currencies: CryptoOrTokenCurrency[];
  drawerConfiguration?: EnhancedModularDrawerConfiguration;
  accounts$?: Observable<WalletAPIAccount[]>;
  source: string;
  flow: string;
  onAssetSelected?: (currency: CryptoOrTokenCurrency) => void;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
};
