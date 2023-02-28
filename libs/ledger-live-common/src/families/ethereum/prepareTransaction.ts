import invariant from "invariant";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  getNetworkInfo,
  inferGasPrice,
  inferMaxFeePerGas,
  inferMaxPriorityFeePerGas,
} from "./gas";
import { estimateGasLimit } from "./gas";
import { isEthereumAddress, padHexString } from "./logic";
import { NetworkInfo, Transaction } from "./types";
import { buildEthereumTx, EIP1559ShouldBeUsed } from "./transaction";
import { prepareTransaction as prepareTransactionModules } from "./modules";
import { findSubAccountById } from "../../account";

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
      // building a bear minimum transaction for gas estimation
      const protoTransaction = (() => {
        try {
          return buildEthereumTx(account, tx, account.operationsCount).tx;
        } catch (e) {
          // fallback in case @ethereumjs/tx breaks on building a potentially partial transaction
          const subAccount = tx.subAccountId
            ? findSubAccountById(account, tx.subAccountId)
            : null;
          const recipient =
            subAccount?.type === "TokenAccount"
              ? subAccount.token.contractAddress
              : tx.recipient;
          return {
            from: account.freshAddress,
            to: recipient,
            data: undefined,
            value: tx.amount,
          };
        }
      })();
      invariant(protoTransaction.to, "ethereum transaction has no recipient");

      estimatedGasLimit = await estimateGasLimit(
        account,
        // Those are the only elements from a transaction necessary to estimate the gas limit
        {
          from: account.freshAddress,
          to: protoTransaction.to!.toString(),
          value:
            "0x" + (padHexString(protoTransaction.value.toString(16)) || "00"),
          data: protoTransaction.data
            ? `0x${padHexString(protoTransaction.data.toString("hex"))}`
            : "0x",
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
