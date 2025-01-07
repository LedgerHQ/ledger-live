import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "./api";
import buildTransaction from "./buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "./logic";
import type { Transaction, TransactionErrors } from "./types";

type IGetEstimatedGasReturnType = {
  fees: BigNumber;
  estimate: {
    maxGasAmount: string;
    gasUnitPrice: string;
    //sequenceNumber: string;
    //expirationTimestampSecs: string;
  };
  errors: TransactionErrors;
};

const CACHE = new Map();

export const getFee = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  const res = {
    fees: new BigNumber(0),
    estimate: {
      maxGasAmount: transaction.estimate.maxGasAmount, // why don't use default
      gasUnitPrice: transaction.estimate.gasUnitPrice, // why don't use default
      //sequenceNumber: transaction.options.sequenceNumber || "",
    },
    errors: { ...transaction.errors },
  };
  CACHE.delete(getCacheKey(transaction)); // this one deletes transaction that was in the begining of the function, cause we are not supposed to change transaction, so to be mmore clear, we should clear cache in the begining

  let gasPrice = DEFAULT_GAS_PRICE;
  try {
    const { gas_estimate } = await aptosClient.estimateGasPrice();
    gasPrice = gas_estimate;
  } catch (error: any) {
    log(`Failed to estimate gas price: ${error.message}`);
  }
  res.estimate.gasUnitPrice = gasPrice.toString();// why don't use value from simulation

  let gasLimit = DEFAULT_GAS;
  if (account.xpub) {
    try {
      const publicKeyEd = new Ed25519PublicKey(account.xpub as string);
      const tx = await buildTransaction(account, transaction, aptosClient);
      const simulation = await aptosClient.simulateTransaction(publicKeyEd, tx);
      const completedTx = simulation[0];

      const expectedGas = BigNumber(gasPrice).multipliedBy(BigNumber(gasLimit));
      const isUnderMaxSpendable = transaction.amount
        .plus(expectedGas)
        .isLessThan(account.spendableBalance);

      if (isUnderMaxSpendable && !completedTx.success) {
        switch (true) {
          case completedTx.vm_status.includes("SEQUENCE_NUMBER"): {
            res.errors.sequenceNumber = completedTx.vm_status;
            break;
          }
          case completedTx.vm_status.includes("TRANSACTION_EXPIRED"): {
            res.errors.expirationTimestampSecs = completedTx.vm_status;
            break;
          }
          case completedTx.vm_status.includes("INSUFFICIENT_BALANCE"): {
            // skip, processed in getTransactionStatus
            break;
          }
          default: {
            throw Error(`Simulation failed with following error: ${completedTx.vm_status}`);
          }
        }
      }

      // can we use estimation from simulation instead of separate request?
      gasLimit = // inconsistency with gas_used
        Number(completedTx.gas_used) * ESTIMATE_GAS_MUL || Number(transaction.options.maxGasAmount); // why use option here but not estimation
    } catch (error: any) {
      log(error.message);
      throw error;
    }
  }
  res.estimate.maxGasAmount = gasLimit.toString();

  // try {
  //   const { sequence_number } = await aptosClient.getAccount(account.freshAddress);
  //   res.estimate.sequenceNumber = sequence_number.toString();
  // } catch (error: any) {
  //   //log(`Failed to fetch sequence number: ${error.message}`);
  // }

  res.fees = BigNumber(gasPrice).multipliedBy(BigNumber(gasLimit));

  return res;
};

const getCacheKey = (transaction: Transaction): string =>
  JSON.stringify({
    amount: transaction.amount,
    //gasUnitPrice: transaction.options.gasUnitPrice,
    maxGasAmount: transaction.options.maxGasAmount,
  });

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  const key = getCacheKey(transaction);

  if (!CACHE.has(key)) {
    CACHE.set(key, await getFee(account, transaction, aptosClient));
  }

  return CACHE.get(key);
};
