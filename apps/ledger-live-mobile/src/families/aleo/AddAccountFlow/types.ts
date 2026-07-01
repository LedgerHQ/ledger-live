import type { Account } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import type { CommonParams } from "LLM/features/Accounts/screens/AddAccount/types";

export type AleoAddAccountParams = CommonParams & {
  device: Device;
  inline?: boolean;
  returnToSwap?: boolean;
  onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
};

// Outer navigator screen (AddAccountNavigator itself, mounted in the root stack).
export type AleoAddAccountParamList = {
  [ScreenName.AleoAddAccount]: AleoAddAccountParams;
};

// Inner stack created inside AddAccountNavigator — keyed on a different screen name,
// so it cannot reuse AleoAddAccountParamList directly.
export type AleoViewKeyFlowParamList = {
  [ScreenName.AleoViewKeyWarning]: AleoAddAccountParams;
};
