import type { PolkadotAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";
import { loadPolkadotCrypto } from "./polkadot-crypto";
import { PolkadotAPI } from "../network";
import BigNumber from "bignumber.js";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} a
 * @param {Transaction} t
 */
const prepareTransaction =
  (polkadotAPI: PolkadotAPI) => async (a: PolkadotAccount, t: Transaction) => {
    await loadPolkadotCrypto();
    let fees = t.fees;
    fees = await getEstimatedFees(polkadotAPI)({
      a,
      t,
    });

    if (!sameFees(fees, t.fees)) {
      return { ...t, fees };
    }

    return t;
  };

export default prepareTransaction;
