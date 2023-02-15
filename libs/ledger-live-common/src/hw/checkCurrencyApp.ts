import Transport from "@ledgerhq/hw-transport";
import getAppAndVersion from "./getAppAndVersion";
import {
  DeviceOnDashboardUnexpected,
  WrongAppForCurrency,
} from "@ledgerhq/errors";
import getAddress from "./getAddress";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
const dashboardAppNames = ["BOLOS", "OLOS\u0000"]; // NB nano x 1.2.4-1 dashboard app name

export default async (
  transport: Transport,
  currency: CryptoCurrency,
  devicePath: string
): Promise<void> => {
  const currentApp = await getAppAndVersion(transport).catch((e) => {
    if (e.status === 0x6e00) return null;
    throw e;
  });

  if (currentApp) {
    if (currentApp.name === currency.managerAppName) {
      return;
    } else if (dashboardAppNames.includes(currentApp.name)) {
      throw new DeviceOnDashboardUnexpected();
    }

    throw new WrongAppForCurrency(
      `wrong app ${currentApp.name}, expected ${currency.managerAppName}`,
      {
        current: currentApp.name,
        expected: currency.managerAppName,
      }
    );
  } else {
    // NB fallback for devices not supporting getAppAndVersion
    await getAddress(transport, {
      derivationMode: "",
      devicePath,
      currency,
      path: runDerivationScheme(
        getDerivationScheme({
          currency,
          derivationMode: "",
        }),
        currency
      ),
      segwit: false,
    });
  }
};
