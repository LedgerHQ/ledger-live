import { AccountLike, Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";

export enum ModularDrawerStep {
  Asset = "Asset",
  Network = "Network",
  Account = "Account",
}

export const MODULAR_DRAWER_KEY = "modularDrawer";

export type OpenModularDrawerParams = {
  currencies?: string[];
  enableAccountSelection?: boolean;
  onAccountSelected?: (account: AccountLike, parentAccount?: Account) => void;
  accounts$?: Observable<WalletAPIAccount[]>;
  flow?: string;
  source?: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  networksConfiguration?: EnhancedModularDrawerConfiguration["networks"];
};

export type OpenModularDrawerParamsWithCallbackId = {
  currencies?: string[];
  enableAccountSelection?: boolean;
  callbackId?: string;
  accountsObservableId?: string;
  flow?: string;
  source?: string;
};

export type OpenModularDrawerFunction = (params?: OpenModularDrawerParams) => void;
