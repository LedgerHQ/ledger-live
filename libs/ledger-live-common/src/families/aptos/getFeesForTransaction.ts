import { Ed25519PublicKey } from "@aptos-labs/ts-sdk";
import { log } from "@ledgerhq/logs";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { AptosAPI } from "./api";
import buildTransaction from "./js-buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL, getMaxSendBalance } from "./logic";
import type { Transaction, TransactionErrors } from "./types";

type IGetEstimatedGasReturnType = {
  fees: BigNumber;
  estimate: {
    maxGasAmount: string;
    gasUnitPrice: string;
    sequenceNumber: string;
    expirationTimestampSecs: string;
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
      maxGasAmount: transaction.estimate.maxGasAmount,
      gasUnitPrice: transaction.estimate.gasUnitPrice,
      sequenceNumber: transaction.options.sequenceNumber || "",
      expirationTimestampSecs: transaction.options.expirationTimestampSecs || "",
    },
    errors: { ...transaction.errors },
  };

  let gasPrice = DEFAULT_GAS_PRICE;
  let gasLimit = DEFAULT_GAS;
  let sequenceNumber = "";

  try {
    const { gas_estimate } = await aptosClient.estimateGasPrice();
    gasPrice = gas_estimate;
  } catch (err) {
    // skip
  }

  if (account.xpub) {
    try {
      const publicKeyEd = new Ed25519PublicKey(account.xpub as string);

      if (transaction.useAllAmount && transaction.firstEmulation === true) {
        transaction.amount = getMaxSendBalance(
          account.spendableBalance,
          new BigNumber(DEFAULT_GAS),
          new BigNumber(DEFAULT_GAS_PRICE),
        );
      }
      const tx = await buildTransaction(account, transaction, aptosClient);
      const simulation = await aptosClient.simulateTransaction(publicKeyEd, tx);
      const completedTx = simulation[0];

      if (!completedTx.success) {
        switch (true) {
          case completedTx.vm_status.includes("SEQUENCE_NUMBER"): {
            res.errors.sequenceNumber = completedTx.vm_status;
            break;
          }
          case completedTx.vm_status.includes("TRANSACTION_EXPIRED"): {
            res.errors.expirationTimestampSecs = completedTx.vm_status;
            break;
          }
          case completedTx.vm_status.includes("EINSUFFICIENT_BALANCE"): {
            // skip, processed in getTransactionStatus
            break;
          }
          default: {
            throw Error(`Simulation failed with following error: ${completedTx.vm_status}`);
          }
        }
      }

      res.estimate.expirationTimestampSecs = completedTx.expiration_timestamp_secs;
      gasLimit =
        Number(completedTx.gas_used) ||
        Math.floor(Number(transaction.options.maxGasAmount) / ESTIMATE_GAS_MUL);
    } catch (error: any) {
      log(error.message);
      throw error;
    }
  }

  try {
    const { sequence_number } = await aptosClient.getAccount(account.freshAddress);
    sequenceNumber = sequence_number;
  } catch (_) {
    // skip
  }

  gasLimit = Math.ceil(gasLimit * ESTIMATE_GAS_MUL);

  res.estimate.gasUnitPrice = gasPrice.toString();
  res.estimate.sequenceNumber = sequenceNumber.toString();
  res.estimate.maxGasAmount = gasLimit.toString();

  if (transaction.firstEmulation) {
    res.fees = res.fees.plus(BigNumber(gasPrice)).multipliedBy(BigNumber(gasLimit));
  } else {
    res.fees = res.fees
      .plus(transaction.options.gasUnitPrice)
      .multipliedBy(BigNumber(transaction.options.maxGasAmount));
  }

  CACHE.delete(getCacheKey(transaction));
  return res;
};

const getCacheKey = (transaction: Transaction): string =>
  JSON.stringify({
    amount: transaction.amount,
    gasUnitPrice: transaction.options.gasUnitPrice,
    maxGasAmount: transaction.options.maxGasAmount,
    sequenceNumber: transaction.options.sequenceNumber,
    expirationTimestampSecs: transaction.options.expirationTimestampSecs,
  });

export const getEstimatedGas = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<IGetEstimatedGasReturnType> => {
  const key = getCacheKey(transaction);

  if (CACHE.has(key)) {
    return CACHE.get(key);
  }

  CACHE.set(key, getFee(account, transaction, aptosClient));

  return CACHE.get(key);
};
