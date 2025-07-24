import { Account } from "@ledgerhq/types-live";

export interface FormattedAccount {
  address: string;
  cryptoId: string;
  fiatValue?: string;
  balance: string;
  protocol: string;
  id: string;
  name: string;
  ticker: string;
}

export interface AccountListProps {
  accounts: Account[];
  formatAccount: (account: Account) => FormattedAccount;
  navigateToEditAccountName: (account: Account) => void;
}

export interface AccountsAddedProps {
  accounts: Account[];
  isAccountSelectionFlow: boolean;
  navigateToEditAccountName: (account: Account) => void;
  navigateToFundAccount: (account: Account) => void;
  navigateToSelectAccount: () => void;
  source: string;
}
