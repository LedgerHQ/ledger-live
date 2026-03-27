import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { AssetTableItem } from "LLD/features/Assets/types";

export type CryptoAddressesViewModel = {
  readonly searchValue: string;
  readonly setSearchValue: (value: string) => void;
  readonly emptyTableMessage: string;
  readonly onAddAddressClick: () => void;
  readonly onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
  readonly rows: AccountLike[];
  readonly lookupParentAccount: (id: string) => Account | undefined | null;
};

export type CryptoAssetsViewModel = {
  readonly title: string;
  readonly onBack: () => void;
  readonly items: AssetTableItem[];
  readonly isLoading: boolean;
  readonly onAssetRowClick: (item: AssetTableItem) => void;
};
