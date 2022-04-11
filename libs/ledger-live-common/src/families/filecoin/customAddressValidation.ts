import type { Core } from "../../libcore/types";
import type { CryptoCurrency } from "../../types";
import { InvalidAddress } from "@ledgerhq/errors";
import { validateAddress } from "./bridge/utils/addresses";
export default async (
  core: Core,
  arg: {
    currency: CryptoCurrency;
    recipient: string;
  }
): Promise<null> => {
  if (validateAddress(arg.recipient).isValid) return Promise.resolve(null);

  return Promise.reject(
    new InvalidAddress(undefined, {
      currencyName: arg.currency.name,
    })
  );
};
