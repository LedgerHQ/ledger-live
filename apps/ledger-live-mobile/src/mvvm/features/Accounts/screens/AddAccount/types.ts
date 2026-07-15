import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import type { Device } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import type { Props as TouchableProps } from "~/components/Touchable";
import { AddAccountContexts } from "./enums";
import type { CantonOnboardAccountParamList } from "~/families/canton/Onboard/types";
import type { AleoAddAccountParamList } from "~/families/aleo/AddAccountFlow/types";

export type AddAccountContextType = `${AddAccountContexts}`;

export type CommonParams = {
  context?: AddAccountContextType;
  onCloseNavigation?: () => void;
  // Number of navigators to pop when closing the flow (calculated at entry point)
  navigationDepth?: number;
  currency: CryptoOrTokenCurrency;
  sourceScreenName?: string;
};
export type NetworkBasedAddAccountNavigator = {
  [ScreenName.ScanDeviceAccounts]: CommonParams & {
    device: Device;
    inline?: boolean;
    returnToSwap?: boolean;
    onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
  };
  [ScreenName.AddAccountsSuccess]: CommonParams & {
    accountsToAdd: Account[];
  };
  [ScreenName.AddAccountsWarning]: CommonParams & {
    emptyAccount?: Account;
    emptyAccountName?: string;
  };
  [ScreenName.NoAssociatedAccounts]: Pick<CommonParams, "onCloseNavigation"> & {
    CustomNoAssociatedAccounts: ({
      style,
    }: {
      style?: {
        paddingHorizontal?: TouchableProps["style"];
      };
    }) => React.JSX.Element;
  };
  [ScreenName.CantonOnboardAccount]: CantonOnboardAccountParamList[ScreenName.CantonOnboardAccount];
  [ScreenName.AleoAddAccount]: AleoAddAccountParamList[ScreenName.AleoAddAccount];
};
