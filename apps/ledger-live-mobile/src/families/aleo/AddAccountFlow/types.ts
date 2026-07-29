import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import type { AddAccountContextType } from "LLM/features/Accounts/screens/AddAccount/types";

export type AleoAddAccountParams = {
  currency: CryptoOrTokenCurrency;
  device: Device;
  context?: AddAccountContextType;
  sourceScreenName?: string;
  onCloseNavigation?: () => void;
  navigationDepth?: number;
  accountsToAdd?: Account[];
  inline?: boolean;
  returnToSwap?: boolean;
  onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
  initialRouteName?:
    | ScreenName.AleoViewKeyWarning
    | ScreenName.AleoViewKeyApprove
    | ScreenName.AleoNoAccountsAdded;
};

export type AleoAddAccountParamList = {
  [ScreenName.AleoAddAccount]: AleoAddAccountParams;
};

export type AleoViewKeyFlowParamList = {
  [ScreenName.AleoViewKeyWarning]: Omit<AleoAddAccountParams, "accountsToAdd">;
  [ScreenName.AleoViewKeyApprove]: AleoAddAccountParams & {
    accountsToAdd: Account[];
  };
  [ScreenName.AleoNoAccountsAdded]: Omit<AleoAddAccountParams, "accountsToAdd">;
};
