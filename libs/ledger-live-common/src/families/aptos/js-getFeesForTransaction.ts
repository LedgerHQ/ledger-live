import BigNumber from "bignumber.js";
import { HexString, TxnBuilderTypes } from "aptos";
import type { Account } from "@ledgerhq/types-live";

import { AptosAPI } from "./api";
import buildTransaction from "./js-buildTransaction";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE, ESTIMATE_GAS_MUL } from "./logic";
import type { Transaction, TransactionErrors } from "./types";
import { log } from "@ledgerhq/logs";

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

  try {
    if (!account.xpub) throw Error("Account public key missing to estimate transaction");

    const tx = await buildTransaction(account, transaction, aptosClient);
    const pubKeyUint = new HexString(account.xpub as string).toUint8Array();
    const publicKeyEd = new TxnBuilderTypes.Ed25519PublicKey(pubKeyUint);
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
    } else {
      res.estimate.maxGasAmount = BigNumber(
        Math.ceil(completedTx.gas_used ? +completedTx.gas_used * ESTIMATE_GAS_MUL : DEFAULT_GAS),
      ).toString();

      if (
        transaction.skipEmulation ||
        +transaction.options.gasUnitPrice !== DEFAULT_GAS_PRICE ||
        +transaction.options.maxGasAmount !== DEFAULT_GAS
      ) {
        res.fees = res.fees
          .plus(
            BigNumber(
              transaction.options.gasUnitPrice || res.estimate.gasUnitPrice || DEFAULT_GAS_PRICE,
            ),
          )
          .multipliedBy(
            BigNumber(transaction.options.maxGasAmount || res.estimate.maxGasAmount || DEFAULT_GAS),
          );
      } else {
        res.fees = res.fees
          .plus(BigNumber(completedTx.gas_unit_price || DEFAULT_GAS_PRICE))
          .multipliedBy(BigNumber(res.estimate.maxGasAmount));
      }

      res.estimate.gasUnitPrice = completedTx.gas_unit_price;
      res.estimate.sequenceNumber = completedTx.sequence_number;
      res.estimate.expirationTimestampSecs = completedTx.expiration_timestamp_secs;
    }
  } catch (e: any) {
    log(e.message);
    throw e;
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
