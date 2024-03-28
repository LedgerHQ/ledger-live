import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import { craftTransaction, defaultExtrinsicArg } from "./buildTransaction";
import { fakeSignExtrinsic } from "./signTransaction";
import polkadotAPI from "../network";

export default async function estimatedFees({
  accountAddress,
  amount,
}: {
  accountAddress: string;
  amount: bigint;
}): Promise<bigint> {
  await loadPolkadotCrypto();

  const { unsigned, registry } = await craftTransaction(
    accountAddress,
    0,
    defaultExtrinsicArg(amount, getAbandonSeedAddress("polkadot")),
  );
  const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const payment = await polkadotAPI.paymentInfo(fakeSignedTx);
  return BigInt(payment.partialFee);
}
