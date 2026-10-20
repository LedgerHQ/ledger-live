import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { PolkadotContext } from "../config";
import type { PolkadotAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} account
 * @param {Transaction} transaction
 */
export const buildPrepareTransaction =
  (context: PolkadotContext): AccountBridge<Transaction, PolkadotAccount>["prepareTransaction"] =>
  async (account, transaction) => {
    const fees = await getEstimatedFees(context, {
      account,
      transaction,
    });

    if (!sameFees(fees, transaction.fees)) {
      return { ...transaction, fees };
    }

    return transaction;
  };
