import Transport from "@ledgerhq/hw-transport";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import getAddress from "./getAddress";
import checkCurrencyApp from "./checkCurrencyApp";
import type { Account, CryptoCurrency } from "../types";
import { isSegwitDerivationMode } from "../derivation";
export default async (
  transport: Transport,
  account: Account,
  currency: CryptoCurrency,
  devicePath: string
): Promise<void> => {
  await checkCurrencyApp(transport, currency, devicePath);
  const { address } = await getAddress(transport, {
    derivationMode: account.derivationMode,
    devicePath,
    currency,
    path: account.freshAddressPath,
    segwit: isSegwitDerivationMode(account.derivationMode),
  });
  const { freshAddress } = account;

  if (freshAddress !== address) {
    throw new WrongDeviceForAccount(`WrongDeviceForAccount ${account.name}`, {
      accountName: account.name,
    });
  }
};
