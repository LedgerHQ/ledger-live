import invariant from "invariant";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  getNetworkInfo,
  inferGasPrice,
  inferMaxFeePerGas,
  inferMaxPriorityFeePerGas,
} from "./gas";
import { estimateGasLimit } from "./gas";
import { isEthereumAddress } from "./logic";
import { findSubAccountById } from "../../account";
import { NetworkInfo, Transaction } from "./types";
import transaction, { buildEthereumTx, EIP1559ShouldBeUsed } from "./transaction";
import { prepareTransaction as prepareTransactionModules } from "./modules";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] =
  async (account, tx) => {
    const networkInfo =
      tx.networkInfo || (await getNetworkInfo(account.currency));

    if (EIP1559ShouldBeUsed(account.currency)) {
      const maxPriorityFeePerGas = inferMaxPriorityFeePerGas(
        tx,
        networkInfo as NetworkInfo
      );
      const maxFeePerGas = inferMaxFeePerGas(
        tx,
        maxPriorityFeePerGas,
        networkInfo as NetworkInfo
      );

      if (
        tx.maxFeePerGas !== maxFeePerGas ||
        tx.maxPriorityFeePerGas !== maxPriorityFeePerGas ||
        tx.networkInfo !== networkInfo
      ) {
        tx = {
          ...tx,
          networkInfo: networkInfo as NetworkInfo,
          maxFeePerGas,
          maxPriorityFeePerGas,
        };
      }
    } else {
      const gasPrice = inferGasPrice(tx, networkInfo as NetworkInfo);
      if (tx.gasPrice !== gasPrice || tx.networkInfo !== networkInfo) {
        tx = { ...tx, networkInfo: networkInfo as NetworkInfo, gasPrice };
      }
    }

    let estimatedGasLimit;
    if (isEthereumAddress(tx.recipient)) {
      const {tx: transaction} = buildEthereumTx(account, tx, account.operationsCount);
      invariant(transaction.to, "ethereum transaction has no recipient");

      estimatedGasLimit = await estimateGasLimit(
        account,
        transaction.to!.toString(),
        // Those are the only elements from a transaction necessary to estimate the gas limit
        {
          from: account.freshAddress,
          value: "0x" + (transaction.value.toString(16) || "00"),
          data: transaction.data ? `0x${transaction.data.toString("hex")}` : "0x",
        }
      );
    }

    if (
      !tx.estimatedGasLimit ||
      (estimatedGasLimit && !estimatedGasLimit.eq(tx.estimatedGasLimit))
    ) {
      tx.estimatedGasLimit = estimatedGasLimit;
    }

    tx = await prepareTransactionModules(account, tx);

    return tx;
  };

export default prepareTransaction;
