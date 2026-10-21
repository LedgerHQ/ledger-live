import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AssetsByAction, HeldAsset } from "@features/platform-quick-actions";

export type AccountAsset = HeldAsset<CryptoOrTokenCurrency, AccountLike, Account>;
export type AccountAssetsByAction = AssetsByAction<AccountAsset>;
