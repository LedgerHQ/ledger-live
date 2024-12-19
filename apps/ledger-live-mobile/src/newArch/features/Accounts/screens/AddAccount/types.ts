import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/types-devices";

export type NetworkBasedAddAccountNavigator = {
  [ScreenName.SelectAccounts]: {
    currency: CryptoCurrency | TokenCurrency;
    createTokenAccount?: boolean;
  };
  [ScreenName.ScanDeviceAccounts]: {
    currency: CryptoCurrency | TokenCurrency;
    device: Device;
    onSuccess?: (_?: unknown) => void;
  };
};
