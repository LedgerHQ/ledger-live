import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { WarningReason } from "../../domain";

export type ActionButtonsProps = {
  primaryAction: { text: string; onClick: () => void } | null;
  secondaryAction: { text: string; onClick: () => void } | null;
};

export interface AccountsWarningProps {
  warningReason: WarningReason;
  currency: CryptoCurrency;
  navigateToEditAccountName: (account: Account) => void;
  navigateToFundAccount: (account: Account) => void;
  emptyAccount?: Account;
  isAccountSelectionFlow: boolean;
  descriptions?: {
    noAccountsAddedWarning?: string;
  };
}
