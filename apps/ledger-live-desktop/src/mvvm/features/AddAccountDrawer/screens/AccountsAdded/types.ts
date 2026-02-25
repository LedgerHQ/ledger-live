import { Account } from "@ledgerhq/types-live";
import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

export interface FormattedAccount {
  address: string;
  cryptoId: string;
  // Raw values for UI formatting
  fiatValue?: number;
  fiatUnit?: Unit;
  balance: BigNumber;
  balanceUnit: Unit;
  // Formatting parameters
  locale?: string;
  discreet?: boolean;
  // Other properties
  protocol: string;
  id: string;
  name: string;
  ticker: string;
}

export interface AccountListProps {
  accounts: Account[];
  formatAccount: (account: Account) => FormattedAccount;
  navigateToEditAccountName: (account: Account) => void;
  isAccountSelectionFlow: boolean;
}

export interface AccountsAddedProps {
  accounts: Account[];
  isAccountSelectionFlow: boolean;
  navigateToEditAccountName: (account: Account) => void;
  navigateToFundAccount: (account: Account) => void;
  navigateToSelectAccount: () => void;
}
