import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { computeRecipientError } from "../bridge/statusHelpers";
import { marginalFeeFor } from "../logic/coin-selection";
import { buildLegacyTransaction, resolveWalletAccount } from "./buildTransaction";

// Strip any stale fee/change from a prior prepare so the UI never shows an amount
// without a matching fee. A send-all amount is the one a prior build resolved, so it
// goes too.
function resetPreparedTransaction(tx: Transaction): Transaction {
  const { zcashFee: _fee, changeAmount: _change, ...rest } = tx;
  return {
    ...rest,
    ...(tx.useAllAmount && { amount: new BigNumber(0) }),
    selectedNotes: [],
  };
}

/**
 * Resolves the fee and change of a transparent send (every send, here: a shielded
 * recipient is refused by the status step). When the build cannot be completed --
 * no recipient yet, not enough balance -- the transaction comes back without a fee
 * and the status step reports why.
 */
export const buildLegacyPrepareTransaction =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["prepareTransaction"] =>
  async (account, transaction) => {
    if (
      computeRecipientError(
        transaction.recipient,
        account.currency.name,
        false,
        account.currency.id,
      )
    ) {
      return resetPreparedTransaction(transaction);
    }

    const walletAccount = await resolveWalletAccount(context, account);
    const { zip2009 } = await context.config(account.currency.id);
    try {
      const { txInfo } = await buildLegacyTransaction(
        context.logger,
        walletAccount,
        transaction,
        marginalFeeFor(account, zip2009),
      );
      const change = txInfo.outputs.filter(output => output.isChange);
      const recipientOutput = txInfo.outputs.find(output => !output.isChange);
      return {
        ...transaction,
        // With useAllAmount the amount is whatever the single recipient output ended up carrying.
        amount:
          transaction.useAllAmount && recipientOutput ? recipientOutput.value : transaction.amount,
        selectedNotes: [],
        zcashFee: new BigNumber(txInfo.fee),
        changeAmount: change.reduce((sum, output) => sum.plus(output.value), new BigNumber(0)),
      };
    } catch (error) {
      if ((error as Error).name === "NotEnoughBalance")
        return resetPreparedTransaction(transaction);
      throw error;
    }
  };
