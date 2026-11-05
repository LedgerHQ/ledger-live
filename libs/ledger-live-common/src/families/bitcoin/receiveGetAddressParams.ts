import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { GetAddressOptions } from "../../hw/getAddress/types";

/** Bitcoin Cash receives on a cashaddr address, as `perCoinLogic.bitcoin_cash.injectGetAddressParams` asks the bridge. */
export default function bitcoinReceiveGetAddressParams(
  currency: CryptoCurrency,
): Partial<GetAddressOptions> {
  return currency.id === "bitcoin_cash" ? { forceFormat: "cashaddr" } : {};
}
