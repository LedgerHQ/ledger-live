import type { Account } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";

export type AleoImportAccountsCallback = (
  viewKeysByAccountId?: Record<string, string | null>,
) => void;

export type AleoViewKeyWarningParams = {
  currency: CryptoOrTokenCurrency;
  device: Device;
  onCancelFlow: () => void;
  onContinueFromWarning?: () => void;
};

export type AleoViewKeyApproveParams = {
  accountsToAdd: Account[];
  currency: CryptoOrTokenCurrency;
  device: Device;
  onConfirmImport: AleoImportAccountsCallback;
  onCancelFlow: () => void;
};

export type AleoViewKeyFlowParamList = {
  [ScreenName.AleoViewKeyWarning]: AleoViewKeyWarningParams;
  [ScreenName.AleoViewKeyApprove]: AleoViewKeyApproveParams;
  [ScreenName.AleoViewKeyConfirmation]: AleoViewKeyApproveParams;
};
