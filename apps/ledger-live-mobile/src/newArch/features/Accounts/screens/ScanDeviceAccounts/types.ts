import { Account, TokenAccount } from "@ledgerhq/types-live";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NetworkBasedAddAccountNavigator } from "../AddAccount/types";
import { ScreenName } from "~/const";
import { AddAccountSupportLink } from "@ledgerhq/live-wallet/addAccounts";
import { AnalyticMetadata } from "LLM/hooks/useAnalytics/types";

export type SubAccountEnhanced = TokenAccount & {
  parentAccount: Account;
  triggerCreateAccount: boolean;
};

export type AccountLikeEnhanced = SubAccountEnhanced | Account | TokenAccount;
export type ScanDeviceAccountsNavigationProps = BaseComposite<
  StackNavigatorProps<NetworkBasedAddAccountNavigator, ScreenName.ScanDeviceAccounts>
>;

export type ScanDeviceAccountsViewModelProps = {
  existingAccounts: Account[];
  blacklistedTokenIds?: string[];
  analyticsMetadata?: AnalyticMetadata;
};

export type ScanDeviceAccountsFooterProps = {
  isScanning: boolean;
  canRetry: boolean;
  canDone: boolean;
  onStop: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onDone: () => void;
  isDisabled: boolean;
  supportLink?: AddAccountSupportLink;
  returnToSwap?: boolean;
};
