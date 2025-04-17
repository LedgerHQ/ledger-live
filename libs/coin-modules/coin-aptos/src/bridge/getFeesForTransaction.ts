import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import { AptosAPI } from "../api";
import buildTransaction from "./buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL, getTokenAccount } from "./logic";
import type { Transaction, TransactionErrors } from "../types";

type IGetEstimatedGasReturnType = {
  fees: BigNumber;
  estimate: {
    maxGasAmount: string;
    gasUnitPrice: string;
  };
  errors: TransactionErrors;
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
      const [completedTx] = await aptosClient.simulateTransaction(publicKeyEd, tx);

      gasLimit = new BigNumber(completedTx.gas_used).multipliedBy(ESTIMATE_GAS_MUL);
      gasPrice = new BigNumber(completedTx.gas_unit_price);

      const expectedGas = gasPrice.multipliedBy(gasLimit);

      if (!completedTx.success) {
        if (completedTx.vm_status.includes("MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS")) {
          res.errors.maxGasAmount = "GasInsufficientBalance";
        } else if (
          !completedTx.vm_status.includes("INSUFFICIENT_BALANCE") &&
          !completedTx.vm_status.includes("EDELEGATOR_ACTIVE_BALANCE_TOO_LOW") &&
          !completedTx.vm_status.includes("0x203ed") // 0x203ed -> PROLOGUE_ECANT_PAY_GAS_DEPOSIT equivalent to INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE
        ) {
          // INSUFFICIENT_BALANCE and EDELEGATOR_ACTIVE_BALANCE_TOO_LOW will be processed by getTransactionStatus
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

const CACHE = makeLRUCache(
  getFee,
  (account: Account, transaction: Transaction) => {
    const tokenAccount = getTokenAccount(account, transaction);
    return `${tokenAccount ? tokenAccount.id : account.id}-${transaction.amount.toString()}}`;
  },
  seconds(30),
);

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  return await CACHE(account, transaction, aptosClient);
};
