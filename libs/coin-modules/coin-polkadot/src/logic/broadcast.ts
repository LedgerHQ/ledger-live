import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(signedExtrinsic: string, currencyId?: string): Promise<string> {
  await loadPolkadotCrypto();

  const currency = getCryptoCurrencyById(currencyId ?? "polkadot");

  await polkadotAPI.submitExtrinsicDryRun(signedExtrinsic, currency);
  return await polkadotAPI.submitExtrinsic(signedExtrinsic, currency);
}
