import type { ElrondProtocolTransaction, Transaction } from "./types";
import { getAccountNonce, getNetworkConfig } from "./api";
import {
  GAS,
  HASH_TRANSACTION,
  MIN_DELEGATION_AMOUNT,
  MIN_DELEGATION_AMOUNT_DENOMINATED,
} from "./constants";
import BigNumber from "bignumber.js";
import { ElrondEncodeTransaction } from "./encode";
import { NetworkConfig } from "@elrondnetwork/erdjs/out";
import { Account, SubAccount } from "@ledgerhq/types-live";

/**
 *
 * @param {ElrondAccount} a
 * @param {Transaction} t
 */
export const buildTransaction = async (
  a: Account,
  ta: SubAccount | null | undefined,
  t: Transaction
): Promise<string> => {
  const address = a.freshAddress;
  const nonce = await getAccountNonce(address);
  const networkConfig: NetworkConfig = await getNetworkConfig();
  const chainID = networkConfig.ChainID.valueOf();
  const gasPrice = networkConfig.MinGasPrice.valueOf();
  t.gasLimit = networkConfig.MinGasLimit.valueOf();

  let transactionValue: BigNumber;

  if (ta) {
    t.data = ElrondEncodeTransaction.ESDTTransfer(t, ta);
    t.gasLimit = GAS.ESDT_TRANSFER; //gasLimit for and ESDT transfer

    transactionValue = new BigNumber(0); //amount of EGLD to be sent should be 0 in an ESDT transfer
  } else {
    transactionValue = t.useAllAmount
      ? a.spendableBalance.minus(t.fees ? t.fees : new BigNumber(0))
      : t.amount;

    switch (t.mode) {
      case "delegate":
        if (transactionValue.lt(MIN_DELEGATION_AMOUNT)) {
          throw new Error(
            `Delegation amount should be minimum ${MIN_DELEGATION_AMOUNT_DENOMINATED} EGLD`
          );
        }

        t.gasLimit = GAS.DELEGATE;
        t.data = ElrondEncodeTransaction.delegate();

        break;
      case "claimRewards":
        t.gasLimit = GAS.CLAIM;
        t.data = ElrondEncodeTransaction.claimRewards();

        //amount of EGLD to be sent should be 0 in a claimRewards transaction
        transactionValue = new BigNumber(0);
        t.amount = new BigNumber(0);
        break;
      case "withdraw":
        t.gasLimit = GAS.DELEGATE;
        t.data = ElrondEncodeTransaction.withdraw();

        //amount of EGLD to be sent should be 0 in a withdraw transaction
        transactionValue = new BigNumber(0);
        t.amount = new BigNumber(0);
        break;
      case "reDelegateRewards":
        t.gasLimit = GAS.DELEGATE;
        t.data = ElrondEncodeTransaction.reDelegateRewards();

        //amount of EGLD to be sent should be 0 in a reDelegateRewards transaction
        transactionValue = new BigNumber(0);
        t.amount = new BigNumber(0);
        break;
      case "unDelegate":
        if (transactionValue.lt(MIN_DELEGATION_AMOUNT)) {
          throw new Error(
            `Undelegated amount should be minimum ${MIN_DELEGATION_AMOUNT_DENOMINATED} EGLD`
          );
        }

        t.gasLimit = GAS.DELEGATE;
        t.data = ElrondEncodeTransaction.unDelegate(t);

        //amount of EGLD to be sent should be 0 in a unDelegate transaction
        transactionValue = new BigNumber(0);
        t.amount = new BigNumber(0);
        break;
      case "send":
        break;
      default:
        throw new Error("Unsupported transaction.mode = " + t.mode);
    }
  }

  const unsigned: ElrondProtocolTransaction = {
    nonce: nonce.valueOf(),
    value: transactionValue.toString(),
    receiver: t.recipient,
    sender: address,
    gasPrice,
    gasLimit: t.gasLimit,
    data: t.data,
    chainID,
    ...HASH_TRANSACTION,
  };

  // Will likely be a call to Elrond SDK
  return JSON.stringify(unsigned);
};
