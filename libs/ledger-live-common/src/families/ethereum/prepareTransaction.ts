import { AccountBridge } from "@ledgerhq/types-live";
import {
  getNetworkInfo,
  inferGasPrice,
  inferMaxFeePerGas,
  inferMaxPriorityFeePerGas,
} from "./gas";
import { EIP1559ShouldBeUsed } from "./transaction";
import { NetworkInfo, Transaction } from "./types";
import { estimateGasLimit, getMinimalGasLimitTransaction } from "./gas";
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
    const minimalGasLimitTx = getMinimalGasLimitTransaction(account, tx);

    if (tx.recipient) {
      estimatedGasLimit = await estimateGasLimit(
        account,
        tx.recipient,
        minimalGasLimitTx
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
