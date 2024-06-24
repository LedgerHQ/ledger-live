import { loadPolkadotCrypto } from "./polkadot-crypto";
import { fakeSignExtrinsic } from "./signTransaction";
import polkadotAPI from "../network";
import { CoreTransaction } from "../types";

export async function estimateFees({ unsigned, registry }: CoreTransaction): Promise<bigint> {
  await loadPolkadotCrypto();

  const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const payment = await polkadotAPI.paymentInfo(fakeSignedTx);
  return BigInt(payment.partialFee);
}
