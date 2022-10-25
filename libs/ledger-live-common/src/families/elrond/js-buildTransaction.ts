import type { ElrondProtocolTransaction, Transaction } from "./types";
import { getAccountNonce, getNetworkConfig } from "./api";
import {
  GAS,
  GAS_PRICE,
  HASH_TRANSACTION,
  MIN_DELEGATION_AMOUNT,
  MIN_DELEGATION_AMOUNT_DENOMINATED,
} from "./constants";
import BigNumber from "bignumber.js";
import { ElrondEncodeTransaction } from "./encode";
import { Account, SubAccount } from "@ledgerhq/types-live";
import { INetworkConfig } from "@elrondnetwork/erdjs/out";

/**
 *
 * @param {ElrondAccount} account
 * @param {SubAccount | null | undefined} tokenAccount
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: Account,
  tokenAccount: SubAccount | null | undefined,
  transaction: Transaction
): Promise<string> => {
  const address = account.freshAddress;
  const nonce = await getAccountNonce(address);
  const networkConfig: INetworkConfig = await getNetworkConfig();
  const chainID = networkConfig.ChainID.valueOf();
  transaction.gasLimit = networkConfig.MinGasLimit.valueOf();

  let transactionValue: BigNumber;

  if (tokenAccount) {
    transaction.data = ElrondEncodeTransaction.ESDTTransfer(
      transaction,
      tokenAccount
    );
    transaction.gasLimit = GAS.ESDT_TRANSFER; //gasLimit for and ESDT transfer

    transactionValue = new BigNumber(0); //amount of EGLD to be sent should be 0 in an ESDT transfer
  } else {
    if (transaction.useAllAmount) {
      transactionValue = account.spendableBalance.minus(
        transaction.fees ? transaction.fees : new BigNumber(0)
      );
    } else {
      transactionValue = transaction.amount;
    }

    switch (transaction.mode) {
      case "delegate":
        if (transactionValue.lt(MIN_DELEGATION_AMOUNT)) {
          throw new Error(
            `Delegation amount should be minimum ${MIN_DELEGATION_AMOUNT_DENOMINATED} EGLD`
          );
        }

        transaction.gasLimit = GAS.DELEGATE;
        transaction.data = ElrondEncodeTransaction.delegate();

        break;
      case "claimRewards":
        transaction.gasLimit = GAS.CLAIM;
        transaction.data = ElrondEncodeTransaction.claimRewards();

        //amount of EGLD to be sent should be 0 in a claimRewards transaction
        transactionValue = new BigNumber(0);
        transaction.amount = new BigNumber(0);
        break;
      case "withdraw":
        transaction.gasLimit = GAS.DELEGATE;
        transaction.data = ElrondEncodeTransaction.withdraw();

        //amount of EGLD to be sent should be 0 in a withdraw transaction
        transactionValue = new BigNumber(0);
        transaction.amount = new BigNumber(0);
        break;
      case "reDelegateRewards":
        transaction.gasLimit = GAS.DELEGATE;
        transaction.data = ElrondEncodeTransaction.reDelegateRewards();

        //amount of EGLD to be sent should be 0 in a reDelegateRewards transaction
        transactionValue = new BigNumber(0);
        transaction.amount = new BigNumber(0);
        break;
      case "unDelegate":
        if (transactionValue.lt(MIN_DELEGATION_AMOUNT)) {
          throw new Error(
            `Undelegated amount should be minimum ${MIN_DELEGATION_AMOUNT_DENOMINATED} EGLD`
          );
        }

        transaction.gasLimit = GAS.DELEGATE;
        transaction.data = ElrondEncodeTransaction.unDelegate(transaction);

        //amount of EGLD to be sent should be 0 in a unDelegate transaction
        transactionValue = new BigNumber(0);
        break;
      case "send":
        break;
      default:
        throw new Error("Unsupported transaction.mode = " + transaction.mode);
    }
  }

  const unsigned: ElrondProtocolTransaction = {
    nonce: nonce.valueOf(),
    value: transactionValue.toString(),
    receiver: transaction.recipient,
    sender: address,
    gasPrice: GAS_PRICE,
    gasLimit: transaction.gasLimit,
    data: transaction.data,
    chainID,
    ...HASH_TRANSACTION,
  };

  // Will likely be a call to Elrond SDK
  return JSON.stringify(unsigned);
};
