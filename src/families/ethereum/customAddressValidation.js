// @flow
import eip55 from "eip55";
import { InvalidAddress, ETHAddressNonEIP } from "@ledgerhq/errors";
import type { CryptoCurrency } from "../../types";

export default async function(
  _core: *,
  { currency, recipient }: { currency: CryptoCurrency, recipient: string }
): Promise<?Error> {
  if (recipient.match(/^0x[0-9a-fA-F]{40}$/)) {
    const slice = recipient.substr(2);
    // access address not using eip55 if they strictly are upper or lower, but provide a warning to user
    if (slice === slice.toUpperCase() || slice === slice.toLowerCase()) {
      return new ETHAddressNonEIP();
    }
    if (eip55.verify(recipient)) {
      return null;
    }
  }

  throw new InvalidAddress(null, { currencyName: currency.name });
}
