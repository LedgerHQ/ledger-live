import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(signature: string, currencyId?: string): Promise<string> {
  await loadPolkadotCrypto();
  if (currencyId) {
    const currency = getCryptoCurrencyById(currencyId);
    return await polkadotAPI.submitExtrinsic(signature, currency);
  }
  return await polkadotAPI.submitExtrinsic(signature);
}
