import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "../api";
import buildTransaction from "./buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "./logic";
import type { Transaction, TransactionErrors } from "../types";

type IGetEstimatedGasReturnType = {
  fees: BigNumber;
  estimate: {
    maxGasAmount: string;
    gasUnitPrice: string;
  };
  errors: TransactionErrors;
};

const CACHE = {
  amount: new BigNumber(0),
  estimate: Promise.resolve({
    fees: new BigNumber(0),
    estimate: {
      maxGasAmount: "",
      gasUnitPrice: "",
    },
    errors: {},
  }),
};

export const getFee = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  const res = {
    fees: new BigNumber(DEFAULT_GAS).multipliedBy(DEFAULT_GAS_PRICE),
    estimate: {
      maxGasAmount: DEFAULT_GAS.toString(),
      gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
    },
    errors: { ...transaction.errors },
  };

  let gasLimit = DEFAULT_GAS;
  let gasPrice = DEFAULT_GAS_PRICE;
  transaction.options = {
    maxGasAmount: gasLimit.toString(),
    gasUnitPrice: gasPrice.toString(),
  };
  if (account.xpub) {
    try {
      const publicKeyEd = new Ed25519PublicKey(account.xpub as string);
      const tx = await buildTransaction(account, transaction, aptosClient);
      const simulation = await aptosClient.simulateTransaction(publicKeyEd, tx);
      const completedTx = simulation[0];

      gasLimit = new BigNumber(completedTx.gas_used).multipliedBy(ESTIMATE_GAS_MUL);
      gasPrice = new BigNumber(completedTx.gas_unit_price);

      const expectedGas = gasPrice.multipliedBy(gasLimit);

      const isUnderMaxSpendable = transaction.amount
        .plus(expectedGas)
        .isLessThan(account.spendableBalance);

      if (isUnderMaxSpendable && !completedTx.success) {
        // we want to skip INSUFFICIENT_BALANCE error because it will be processed by getTransactionStatus
        if (!completedTx.vm_status.includes("INSUFFICIENT_BALANCE")) {
          throw Error(`Simulation failed with following error: ${completedTx.vm_status}`);
        }
      }
      res.fees = expectedGas;
      res.estimate.maxGasAmount = gasLimit.toString();
      res.estimate.gasUnitPrice = completedTx.gas_unit_price;
    } catch (error: any) {
      log(error.message);
      throw error;
    }
  }
  return res;
};

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  if (!CACHE.amount.eq(transaction.amount)) {
    CACHE.estimate = getFee(account, transaction, aptosClient);
    CACHE.amount = transaction.amount;
  }

  // XXX: we await Promise form getFee() in this place to make cache work for asynchronous calls
  // Example [if wee await getFee()]: thread 1 goes to getFee() and awaits there for transaction simulation.
  // at this moment thread 2 will enter getEstimatedGas() CACHE is not set yet, it will call getFee() as well
  // Current implementation: CACHE.estimate set immediately after getFee() is called, so thread 2 will not go under if clause
  // and both treads will wait for promise resolve in return statement.
  return await CACHE.estimate;
};
