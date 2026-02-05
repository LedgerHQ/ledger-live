import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountNonce } from "../../network/proxyClient";

export async function getNextValidSequence(
  address: string,
  currency: CryptoCurrency,
): Promise<number> {
  const result = await getAccountNonce(currency, address);
  return result.nonce;
}
