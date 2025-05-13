import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib-es/currencies";
import polkadotAPI from "../network";
import { PolkadotAccount } from "../types";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(signature: string, account: PolkadotAccount): Promise<string> {
  await loadPolkadotCrypto();
  const currency = getCryptoCurrencyById(account.currency.id);
  return await polkadotAPI.submitExtrinsic(signature, currency);
}
