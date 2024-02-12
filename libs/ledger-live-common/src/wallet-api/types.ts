import type { Account, SignedOperation } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type { CustomHandlers as WalletAPICustomHandlers } from "@ledgerhq/wallet-api-server";
import type { Transaction } from "../generated/types";
import { LiveAppManifest } from "../platform/types";

export type { WalletAPITransaction, WalletAPICustomHandlers };

export type {
  Families as WalletAPIFamilies,
  Account as WalletAPIAccount,
  Currency as WalletAPICurrency,
  CryptoCurrency as WalletAPICryptoCurrency,
  ERC20TokenCurrency as WalletAPIERC20TokenCurrency,
} from "@ledgerhq/wallet-api-core";

export type { WalletAPIServer } from "@ledgerhq/wallet-api-server";

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

// complete: discover catalog + search + deeplink
// searchable: only appears via search
// deep: only appears via deeplink
export type Visibility = "complete" | "searchable" | "deep";

// TODO update to the new manifest types from wallet-api when released
export type AppManifest = LiveAppManifest;

export type WalletAPISignedTransaction = SignedOperation;

export type WalletAPISupportedCurrency = CryptoCurrency | TokenCurrency;

export type GetWalletAPITransactionSignFlowInfos<
  T extends WalletAPITransaction,
  U extends Transaction,
> = ({ walletApiTransaction, account }: { walletApiTransaction: T; account: Account }) => {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<U>;
};

export type AreFeesProvided<T extends WalletAPITransaction> = (tx: T) => boolean;

export type ConvertToLiveTransaction<T extends WalletAPITransaction, U extends Transaction> = ({
  walletApiTransaction,
  account,
}: {
  walletApiTransaction: T;
  account: Account;
}) => Partial<U>;

export type DiscoverDB = {
  recentlyUsed: RecentlyUsed[];
};

export type RecentlyUsed = {
  id: string;
  usedAt: string;
};
