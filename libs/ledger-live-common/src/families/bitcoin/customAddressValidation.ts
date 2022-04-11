import { InvalidAddress } from "@ledgerhq/errors";
import type { Core } from "../../libcore/types";
import type { CryptoCurrency } from "../../types";
import { perCoinLogic } from "./transaction";
export default async (
  core: Core,
  arg: {
    currency: CryptoCurrency;
    recipient: string;
  }
): Promise<null> => {
  const { currency } = arg;
  const perCoin = perCoinLogic[currency.id];
  const recipient = perCoin?.asLibcoreTransactionRecipient
    ? perCoin.asLibcoreTransactionRecipient(arg.recipient)
    : arg.recipient;
  const poolInstance = core.getPoolInstance();
  const currencyCore = await poolInstance.getCurrency(currency.id);
  const value = await core.Address.isValid(recipient, currencyCore);

  if (value) {
    return Promise.resolve(null);
  }

  return Promise.reject(
    new InvalidAddress(undefined, {
      currencyName: currency.name,
    })
  );
};
