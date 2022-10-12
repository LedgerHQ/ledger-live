import Transport from "@ledgerhq/hw-transport";
import { WrongDeviceForAccount } from "@ledgerhq/errors";
import getAddress from "./getAddress";
import checkCurrencyApp from "./checkCurrencyApp";
import { DerivationMode, isSegwitDerivationMode } from "../derivation";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
export default async (
  transport: Transport,
  account: Account,
  currency: CryptoCurrency,
  devicePath: string
): Promise<void> => {
  await checkCurrencyApp(transport, currency, devicePath);
  const { address } = await getAddress(transport, {
    derivationMode: account.derivationMode as DerivationMode,
    devicePath,
    currency,
    path: account.freshAddressPath,
    segwit: isSegwitDerivationMode(account.derivationMode as DerivationMode),
  });
  const { freshAddress } = account;

  if (freshAddress !== address) {
    throw new WrongDeviceForAccount(`WrongDeviceForAccount ${account.name}`, {
      accountName: account.name,
    });
  }
};
