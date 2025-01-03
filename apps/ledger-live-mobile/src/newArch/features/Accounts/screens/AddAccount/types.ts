import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ScreenName } from "~/const";
import { Device } from "@ledgerhq/types-devices";

type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
};
export type NetworkBasedAddAccountNavigator = {
  [ScreenName.SelectAccounts]: CommonParams & {
    currency: CryptoCurrency | TokenCurrency;
    createTokenAccount?: boolean;
  };
  [ScreenName.ScanDeviceAccounts]: CommonParams & {
    currency: CryptoCurrency | TokenCurrency;
    device: Device;
    onSuccess?: (_?: unknown) => void;
  };
};
