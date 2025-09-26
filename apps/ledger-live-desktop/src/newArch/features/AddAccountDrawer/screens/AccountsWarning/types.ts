import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { WarningReason } from "../../domain";

export interface ActionButtonsProps {
  primaryAction: {
    text: string;
    onClick: () => void;
  };
  secondaryAction: {
    text: string;
    onClick: () => void;
  };
}

export interface AccountsWarningProps {
  warningReason: WarningReason;
  currency: CryptoCurrency;
  navigateToEditAccountName: (account: Account) => void;
  navigateToFundAccount: (account: Account) => void;
  emptyAccount?: Account;
  isAccountSelectionFlow: boolean;
}
