import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import type { PolkadotAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";
import { buildTransaction } from "./buildTransaction";
import { fakeSignExtrinsic } from "./signTransaction";
import polkadotAPI from "../network";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
}: {
  a: PolkadotAccount;
  t: Transaction;
}): Promise<BigNumber> => {
  await loadPolkadotCrypto();

  const transaction = {
    ...t,
    recipient: getAbandonSeedAddress(a.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      a,
      t: { ...t, fees: new BigNumber(0) },
    }), // Remove fees if present since we are fetching fees
  };
  const { unsigned, registry } = await buildTransaction(a, transaction);
  const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
  const payment = await polkadotAPI.getPaymentInfo({
    a,
    t: transaction,
    signedTx: fakeSignedTx,
  });
  return new BigNumber(payment.partialFee);
};

export default getEstimatedFees;
