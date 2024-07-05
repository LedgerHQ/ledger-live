import { getSerializedTransaction } from "@ledgerhq/coin-evm/transaction";
import { TransactionSubset } from "@ledgerhq/context-module";
import { SupportedTransaction } from "../model/Transaction";
import LL from "@ledgerhq/coin-evm/types/index";
import { ethers } from "ethers";
import BigNumber from "bignumber.js";

type MapTransactionResult = {
  transactionRaw: string;
  transactionSubset: TransactionSubset;
};

export class TxMapper {
  mapTransaction(tx: SupportedTransaction): MapTransactionResult {
    if (this.isEthersv5Transaction(tx)) {
      const rawTx = ethers.utils.serializeTransaction(tx).slice(2);
      const transactionSubset = this.mapEthersv5Tx(tx);
      return { transactionSubset, transactionRaw: rawTx };
    }

    if (this.isLLTransaction(tx)) {
      const rawTx = getSerializedTransaction(tx).slice(2);
      const transactionSubset = this.mapLLTx(tx);
      return {
        transactionSubset,
        transactionRaw: rawTx,
      };
    }

    throw new Error("Invalid transaction type");
  }

  private mapEthersv5Tx(tx: ethers.Transaction): TransactionSubset {
    return {
      to: tx.to,
      data: tx.data,
      chainId: tx.chainId,
    };
  }

  private isEthersv5Transaction(tx: SupportedTransaction): tx is ethers.Transaction {
    return (
      typeof tx === "object" &&
      tx !== null &&
      (tx["to"] === undefined || typeof tx["to"] === "string") &&
      (tx["from"] === undefined || typeof tx["from"] === "string") &&
      typeof tx.nonce === "number" &&
      tx.gasLimit instanceof ethers.BigNumber &&
      (tx.gasPrice === undefined || tx.gasPrice instanceof ethers.BigNumber) &&
      typeof tx.data === "string" &&
      tx["value"] instanceof ethers.BigNumber &&
      typeof tx.chainId === "number"
    );
  }

  private mapLLTx(tx: LL.Transaction): TransactionSubset {
    return {
      to: tx.recipient,
      data: tx.data?.toString("hex"),
      chainId: tx.chainId,
    };
  }

  private isLLTransaction(tx: SupportedTransaction): tx is LL.Transaction {
    return (
      typeof tx === "object" &&
      tx !== null &&
      typeof tx["recipient"] === "string" &&
      tx["amount"] instanceof BigNumber &&
      tx["gasLimit"] instanceof BigNumber &&
      tx["gasPrice"] instanceof BigNumber &&
      typeof tx.chainId === "number" &&
      typeof tx.nonce === "number" &&
      tx["mode"] === "send" &&
      tx["family"] === "evm" &&
      (tx["data"] === undefined || tx["data"] instanceof Buffer)
    );
  }
}
