import { loadPolkadotCrypto } from "./polkadot-crypto";
import { fakeSignExtrinsic } from "./signTransaction";
import polkadotAPI from "../network";
import { CoreTransaction } from "../types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export async function estimateFees(
  { unsigned, registry }: CoreTransaction,
  currency?: CryptoCurrency,
): Promise<bigint> {
  await loadPolkadotCrypto();

  const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const payment = await polkadotAPI.paymentInfo(fakeSignedTx, currency);
  return BigInt(payment.partialFee);
}
