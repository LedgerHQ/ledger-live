import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { BoilerplateContext } from "../config";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { getNextSequence } from "../network/node";
import { Transaction } from "../types";

export const buildPrepareTransaction =
  (context: BoilerplateContext): AccountBridge<Transaction>["prepareTransaction"] =>
  async (account, transaction) => {
    const config = await context.config();
    const seq = await getNextSequence(config, account.freshAddress);

    const craftedTransaction = await craftTransaction(
      { address: account.freshAddress, nextSequenceNumber: seq },
      { amount: transaction.amount, recipient: transaction.recipient },
    );

    const fee = await estimateFees(config, craftedTransaction.serializedTransaction);

    if (transaction.fee !== new BigNumber(fee.toString())) {
      return { ...transaction, fee: new BigNumber(fee.toString()) };
    }

    return transaction;
  };
