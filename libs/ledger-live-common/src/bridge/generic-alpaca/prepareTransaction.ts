import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";

function bnEq(a: BigNumber | null | undefined, b: BigNumber | null | undefined): boolean {
  return !a && !b ? true : !a || !b ? false : a.eq(b);
}

export function genericPrepareTransaction(
  network,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (_account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(_account, transaction),
    );
    const bnFee = BigNumber(fees.value.toString());

    log("xrp-preparetx", "setting fees on tx", { transaction });
    // if (transaction.fees !== bnFee) {
    if (!bnEq(transaction.fees, bnFee)) {
      try {
        log("xrp-preparetx", "changing tx", { txfees: transaction.fees, fees: bnFee });
      } catch (e) {
        console.error("error logging fees");
      }
      return { ...transaction, fees: bnFee };
    }

    return transaction;
  };
}
