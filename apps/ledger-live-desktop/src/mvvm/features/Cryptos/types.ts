import type { Account, AccountLike } from "@ledgerhq/types-live";

export type CryptosViewModel = {
  navigateToDashboard: () => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  onAccountClick: (account: AccountLike, parentAccount?: Account | null) => void;
};
