import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { type PolkadotCoinConfig } from "../config";
import polkadotAPI from "../network";
import { CoreTransaction } from "../types";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import { fakeSignExtrinsic } from "./signTransaction";

export async function estimateFees(
  config: PolkadotCoinConfig,
  { unsigned, registry }: CoreTransaction,
  currency?: CryptoCurrency,
): Promise<bigint> {
  await loadPolkadotCrypto();

  const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const payment = await polkadotAPI.paymentInfo(config, fakeSignedTx, currency);
  return BigInt(payment.partialFee);
}
