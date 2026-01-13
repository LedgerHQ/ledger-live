import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function getBalance(_currency: CryptoCurrency, _address: string): Promise<Balance[]> {
  throw new Error("getBalance is not supported");
}
