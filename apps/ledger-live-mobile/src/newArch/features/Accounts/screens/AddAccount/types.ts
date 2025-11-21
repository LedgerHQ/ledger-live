import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/types-devices";
import { Account } from "@ledgerhq/types-live";
import { Props as TouchableProps } from "~/components/Touchable";
import { AddAccountContexts } from "./enums";
import { CantonOnboardAccountParamList } from "~/families/canton/Onboard/types";

export type AddAccountContextType = `${AddAccountContexts}`;

type CommonParams = {
  context?: AddAccountContextType;
  onCloseNavigation?: () => void;
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
    }) => JSX.Element;
  };
  [ScreenName.CantonOnboardAccount]: CantonOnboardAccountParamList[ScreenName.CantonOnboardAccount];
};
