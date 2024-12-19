import { Account, SubAccount, TokenAccount } from "@ledgerhq/types-live";

export type SubAccountEnhanced = SubAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

export type AccountLikeEnhanced = SubAccountEnhanced | Account | TokenAccount;
