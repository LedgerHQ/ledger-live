import type { Account, AccountLike } from "@ledgerhq/types-live";

export type CryptoViewModel = {
  searchValue: string;
  setSearchValue: (value: string) => void;
  onAddAddressClick: () => void;
  onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
  rows: AccountLike[];
  lookupParentAccount: (id: string) => Account | undefined | null;
};
