import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/types-devices";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import { Account } from "@ledgerhq/types-live";

type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
  currency: CryptoOrTokenCurrency;
};
export type NetworkBasedAddAccountNavigator = {
  [ScreenName.ScanDeviceAccounts]: CommonParams & {
    device: Device;
    inline?: boolean;
    returnToSwap?: boolean;
    onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
  };
  [ScreenName.SelectAccounts]: CommonParams & {
    createTokenAccount?: boolean;
  };
  [ScreenName.AddAccountsSuccess]: CommonParams & {
    fundedAccounts: AccountLikeEnhanced[];
    accountsWithZeroBalance: AccountLikeEnhanced[];
  };
};
