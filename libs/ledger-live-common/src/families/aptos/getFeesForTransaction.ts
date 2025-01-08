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
  };
  errors: TransactionErrors;
};

const CACHE = {
  amount: BigNumber(0),
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
    fees: new BigNumber(DEFAULT_GAS * DEFAULT_GAS_PRICE),
    estimate: {
      maxGasAmount: DEFAULT_GAS.toString(),
      gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
    },
    errors: { ...transaction.errors },
  };

  let gasLimit = DEFAULT_GAS;
  let gasPrice = DEFAULT_GAS_PRICE;
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

      gasLimit = Number(completedTx.gas_used) * ESTIMATE_GAS_MUL;
      gasPrice = Number(completedTx.gas_unit_price);

      const expectedGas = BigNumber(gasPrice * gasLimit);

      const isUnderMaxSpendable = transaction.amount
        .plus(expectedGas)
        .isLessThan(account.spendableBalance);

      if (isUnderMaxSpendable && !completedTx.success) {
        switch (true) {
          case completedTx.vm_status.includes("INSUFFICIENT_BALANCE"): {
            // skip, processed in getTransactionStatus
            break;
          }
          default: {
            throw Error(`Simulation failed with following error: ${completedTx.vm_status}`);
          }
        }
      }
      res.fees = BigNumber(gasPrice).multipliedBy(BigNumber(gasLimit));
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

  return await CACHE.estimate;
};
