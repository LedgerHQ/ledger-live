import type { SignedOperation } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type { Transaction } from "../generated/types";
import { LiveAppManifest } from "../platform/types";

export type { WalletAPITransaction };

export type {
  Families as WalletAPIFamilies,
  Account as WalletAPIAccount,
  Currency as WalletAPICurrency,
  CryptoCurrency as WalletAPICryptoCurrency,
  ERC20TokenCurrency as WalletAPIERC20TokenCurrency,
} from "@ledgerhq/wallet-api-core";

export {
  CurrencyType as WalletAPICurrencyType,
  TokenStandard as WalletAPITokenStandard,
} from "@ledgerhq/wallet-api-core";

export type TranslatableString = {
  en: string;
  [locale: string]: string;
};

export type AppPlatform = "ios" | "android" | "desktop";

export type AppBranch = "stable" | "experimental" | "soon" | "debug";
export type Visibility = "complete" | "searchable" | "deep";

export type AppPermission = {
  method: string;
  params?: any;
};

// TODO update to the new manifest types from wallet-api when released
export type AppManifest = LiveAppManifest;

export type WalletAPISignedTransaction = SignedOperation;

export type WalletAPISupportedCurrency = CryptoCurrency | TokenCurrency;

export type GetWalletAPITransactionSignFlowInfos<
  T extends WalletAPITransaction,
  U extends Transaction
> = (tx: T) => {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<U>;
};

export type AreFeesProvided<T extends WalletAPITransaction> = (
  tx: T
) => boolean;

export type ConvertToLiveTransaction<
  T extends WalletAPITransaction,
  U extends Transaction
> = (tx: T) => Partial<U>;
