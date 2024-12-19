import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/types-devices";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
};
export type NetworkBasedAddAccountNavigator = {
  [ScreenName.ScanDeviceAccounts]: CommonParams & {
    currency: CryptoOrTokenCurrency;
    device: Device;
    inline?: boolean;
    returnToSwap?: boolean;
    onSuccess?: (res: { scannedAccounts: Account[]; selected: Account[] }) => void;
  };
  [ScreenName.SelectAccounts]: CommonParams & {
    currency: CryptoCurrency | TokenCurrency;
    createTokenAccount?: boolean;
  };
  [ScreenName.AddAccountsSuccess]: {
    currency: CryptoOrTokenCurrency;
    fundedAccounts: AccountLikeEnhanced[];
    accountsWithZeroBalance: AccountLikeEnhanced[];
  };
};
