import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { type PolkadotCoinConfig } from "../config";
import polkadotAPI from "../network";
import { loadPolkadotCrypto } from "./polkadot-crypto";

export async function broadcast(
  config: PolkadotCoinConfig,
  signedExtrinsic: string,
  currencyId?: string,
): Promise<string> {
  await loadPolkadotCrypto();

  const currency = getCryptoCurrencyById(currencyId ?? "polkadot");

  await polkadotAPI.submitExtrinsicDryRun(config, signedExtrinsic, currency);
  return await polkadotAPI.submitExtrinsic(config, signedExtrinsic, currency);
}
