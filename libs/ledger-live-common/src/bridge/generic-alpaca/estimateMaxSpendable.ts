import { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "../../account";
import { getAlpacaApi } from "./alpaca";
import { createTransaction } from "./createTransaction";
import { bigNumberToBigIntDeep, extractBalances, transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";
import { getBridgeApi } from "./bridge";

export function genericEstimateMaxSpendable(
  network,
  kind,
): AccountBridge<GenericTransaction>["estimateMaxSpendable"] {
  return async ({ account, parentAccount, transaction }) => {
    if (account.type === "TokenAccount") {
      return account.spendableBalance;
    }
    const mainAccount = getMainAccount(account, parentAccount);
    const alpacaApi = await getAlpacaApi(mainAccount.currency.id, kind);
    const bridgeApi = getBridgeApi(mainAccount.currency, network);
    const draftTransaction = {
      ...createTransaction(account),
      ...transaction,
      amount: mainAccount.spendableBalance,
      useAllAmount: true,
    };

    let fees = transaction?.fees;
    if (!BigNumber.isBigNumber(fees)) {
      const { value } = await alpacaApi.estimateFees(
        transactionToIntent(
          mainAccount,
          draftTransaction,
          bridgeApi.computeIntentType,
          alpacaApi.craftTransactionData,
        ),
      );

      fees = new BigNumber(value.toString());
    }

    // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22229
    const { amount } = await alpacaApi.validateIntent(
      transactionToIntent(
        account,
        { ...draftTransaction },
        bridgeApi.computeIntentType,
        alpacaApi.craftTransactionData,
      ),
      extractBalances(account, bridgeApi.getAssetFromToken),
      bigNumberToBigIntDeep({ value: transaction?.fees ?? new BigNumber(0) }),
    );
    if (["stellar", "tezos", "evm", "solana"].includes(network)) {
      return amount > 0 ? new BigNumber(amount.toString()) : new BigNumber(0);
    }
    const bnFee = BigNumber(fees.toString());
    return BigNumber.max(0, account.spendableBalance.minus(bnFee));
  };
}
