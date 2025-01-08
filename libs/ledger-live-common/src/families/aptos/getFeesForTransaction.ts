import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "./api";
import buildTransaction from "./buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "./logic";
import type { Transaction, TransactionErrors } from "./types";
import { string } from "zod";

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

const CACHE = {
  amount: BigNumber(0),
  estimate: {
    fees: new BigNumber(0),
    estimate: {
      maxGasAmount: "",
      gasUnitPrice: "",
    },
    errors: {},
  },
};

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

  let gasPrice = DEFAULT_GAS_PRICE;
  try {
    const { gas_estimate } = await aptosClient.estimateGasPrice();
    gasPrice = gas_estimate;
  } catch (error: any) {
    log(`Failed to estimate gas price: ${error.message}`);
  }
  res.estimate.gasUnitPrice = gasPrice.toString(); // why don't use value from simulation

  // pros:  we have default behaviour and have predictable results for all simulations
  // const: if network parameters changes and our default parameters will not work, this cal lead to transaction rejection
  // without possibility to change parameters
  // what we should do: set only max gas amout to transaction, we don't expect default transactions gas will change a lot,
  // but if it will, we can easily fix this, on the other hand if gas will change we will not be dependent on it

  let gasLimit = DEFAULT_GAS;
  transaction.estimate = {
    maxGasAmount: gasLimit.toString(),
    gasUnitPrice: gasPrice.toString(),
  };
  if (account.xpub) {
    try {
      const publicKeyEd = new Ed25519PublicKey(account.xpub as string);
      const tx = await buildTransaction(account, transaction, aptosClient);
      const simulation = await aptosClient.simulateTransaction(publicKeyEd, tx);
      const completedTx = simulation[0];

      const expectedGas = BigNumber(gasPrice).multipliedBy(BigNumber(gasLimit)); // TODO: think about situation when expectedGas increases
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

      gasLimit = Number(completedTx.gas_used) * ESTIMATE_GAS_MUL || DEFAULT_GAS; // inconsistency with gas_used // make proper check and remove unnedded or condition
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

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  if (!CACHE.amount.eq(transaction.amount)) {
    CACHE.estimate = await getFee(account, transaction, aptosClient);
    CACHE.amount = transaction.amount;
  }

  return CACHE.estimate;
};
