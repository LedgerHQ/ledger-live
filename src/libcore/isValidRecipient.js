// @flow

import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { InvalidAddress } from "@ledgerhq/live-common/lib/errors";
import load from "./load";

export async function isValidRecipient({
  currency,
  recipient,
}: {
  currency: CryptoCurrency,
  recipient: string,
}): Promise<?Error> {
  const core = await load();
  const poolInstance = core.getPoolInstance();
  const currencyCore = await core.coreWalletPool.getCurrency(
    poolInstance,
    currency.id,
  );
  const addr = core.coreAddress;
  const { value } = await addr.isValid(recipient, currencyCore);
  if (value) {
    return Promise.resolve(null);
  }

  return Promise.reject(
    new InvalidAddress(null, { currencyName: currency.name }),
  );
}
