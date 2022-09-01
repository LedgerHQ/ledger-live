import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ScreenName } from "../../../const";

export type MigrateAccountsNavigatorParamList = {
  [ScreenName.MigrateAccountsOverview]: {
    showNotice: boolean;
  };
  [ScreenName.MigrateAccountsConnectDevice]: {
    currency?: CryptoCurrency | null;
    appName?: string;
    device?: Device;
  };
  [ScreenName.MigrateAccountsProgress]: {
    currency: CryptoCurrency;
    // FIXME: PROBABLY NOT THE RIGHT DEVICE ¯\_(ツ)_/¯ BUT
    // THE ONES FROM OUR TYPE LIBRARIES ARE `any`
    device: Device;
  };
};
