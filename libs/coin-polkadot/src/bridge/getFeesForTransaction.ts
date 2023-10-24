import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { PolkadotAccount, Transaction } from "../types";
import { calculateAmount } from "./logic";
import { buildTransaction } from "./buildTransaction";
import { fakeSignExtrinsic } from "./signOperation";
import { PolkadotAPI } from "../api";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
const getEstimatedFees =
  (polkadotAPI: PolkadotAPI) =>
  async ({ a, t }: { a: PolkadotAccount; t: Transaction }): Promise<BigNumber> => {
    const transaction = {
      ...t,
      recipient: getAbandonSeedAddress(a.currency.id),
      // Always use a fake recipient to estimate fees
      amount: calculateAmount({
        a,
        t: { ...t, fees: new BigNumber(0) },
      }), // Remove fees if present since we are fetching fees
    };
    const { unsigned, registry } = await buildTransaction(polkadotAPI)(a, transaction);
    const fakeSignedTx = await fakeSignExtrinsic(unsigned, registry);
    const payment = await polkadotAPI.getPaymentInfo({
      a,
      t: transaction,
      signedTx: fakeSignedTx,
    });
    return new BigNumber(payment.partialFee);
  };

export default getEstimatedFees;
