import { Account } from "@ledgerhq/types-live";

export interface FormattedAccount {
  address: string;
  cryptoId: string;
  fiatValue: string;
  protocol: string;
  id: string;
  name: string;
  ticker: string;
}

export interface AccountListProps {
  accounts: Account[];
  formatAccount: (account: Account) => FormattedAccount;
}

export interface AccountsAddedProps {
  accounts: Account[];
}
