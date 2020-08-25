// @flow
import invariant from "invariant";
import eip55 from "eip55";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { NotEnoughBalance } from "@ledgerhq/errors";
import type {
  Transaction,
  TransactionRaw,
  EthereumGasLimitRequest,
} from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { apiForCurrency } from "../../api/Ethereum";
import { makeLRUCache } from "../../cache";

export const formatTransaction = (
  t: Transaction,
  mainAccount: Account
): string => {
  const gasLimit = getGasLimit(t);
  const account =
    (t.subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === t.subAccountId)) ||
    mainAccount;
  return `
SEND ${
    t.useAllAmount
      ? "MAX"
      : formatCurrencyUnit(getAccountUnit(account), t.amount, {
          showCode: true,
          disableRounding: true,
        })
  }
TO ${t.recipient}
with gasPrice=${formatCurrencyUnit(
    mainAccount.currency.units[1],
    t.gasPrice || BigNumber(0)
  )}
with gasLimit=${gasLimit.toString()}`;
};

const defaultGasLimit = BigNumber(0x5208);

export const getGasLimit = (t: Transaction): BigNumber =>
  t.userGasLimit || t.estimatedGasLimit || defaultGasLimit;

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    family: tr.family,
    gasPrice: tr.gasPrice ? BigNumber(tr.gasPrice) : null,
    userGasLimit: tr.userGasLimit ? BigNumber(tr.userGasLimit) : null,
    estimatedGasLimit: tr.estimatedGasLimit
      ? BigNumber(tr.estimatedGasLimit)
      : null,
    feeCustomUnit: tr.feeCustomUnit, // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: BigNumber(networkInfo.gasPrice),
    },
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    family: t.family,
    gasPrice: t.gasPrice ? t.gasPrice.toString() : null,
    userGasLimit: t.userGasLimit ? t.userGasLimit.toString() : null,
    estimatedGasLimit: t.estimatedGasLimit
      ? t.estimatedGasLimit.toString()
      : null,
    feeCustomUnit: t.feeCustomUnit, // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: networkInfo.gasPrice.toString(),
    },
  };
};

const ethereumTransferMethodID = Buffer.from("a9059cbb", "hex");

export function serializeTransactionData(
  account: Account,
  transaction: Transaction
): ?Buffer {
  const { subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find((t) => t.id === subAccountId)
    : null;
  if (!subAccount) return;
  const recipient = eip55.encode(transaction.recipient);
  const { balance } = subAccount;
  let amount;
  if (transaction.useAllAmount) {
    amount = balance;
  } else {
    if (!transaction.amount) return;
    amount = BigNumber(transaction.amount);
    if (amount.gt(subAccount.balance)) {
      throw new NotEnoughBalance();
    }
  }
  const to256 = Buffer.concat([
    Buffer.alloc(12),
    Buffer.from(recipient.replace("0x", ""), "hex"),
  ]);
  invariant(to256.length === 32, "recipient is invalid");
  const amountHex = amount.toString(16);
  const amountBuf = Buffer.from(
    amountHex.length % 2 === 0 ? amountHex : "0" + amountHex,
    "hex"
  );
  const amount256 = Buffer.concat([
    Buffer.alloc(32 - amountBuf.length),
    amountBuf,
  ]);
  return Buffer.concat([ethereumTransferMethodID, to256, amount256]);
}

export function inferEthereumGasLimitRequest(
  account: Account,
  transaction: Transaction
): EthereumGasLimitRequest {
  const r: EthereumGasLimitRequest = {
    from: account.freshAddress,
    amplifier: "2",
  };
  if (transaction.gasPrice) {
    r.gasPrice = "0x" + transaction.gasPrice.toString();
  }
  try {
    const data = serializeTransactionData(account, transaction);
    if (data) {
      r.data = "0x" + data.toString("hex");
    }
  } catch (e) {
    log("warn", "couldn't serializeTransactionData: " + e);
  }

  const { subAccountId } = transaction;
  const subAccount = subAccountId
    ? account.subAccounts &&
      account.subAccounts.find((t) => t.id === subAccountId)
    : null;

  if (subAccount && subAccount.type === "TokenAccount") {
    const { token } = subAccount;
    r.value = "0x0";
    r.to = token.contractAddress;
  } else {
    if (transaction.recipient) {
      try {
        const recipient = eip55.encode(transaction.recipient);
        r.to = recipient;
      } catch (e) {
        log("warn", "couldn't encode recipient: " + e);
      }
    }
    if (transaction.useAllAmount) {
      r.value = "0x" + account.balance.toString();
    } else {
      if (transaction.amount) {
        r.value = "0x" + transaction.amount.toString();
      }
    }
  }

  return r;
}

export const estimateGasLimit: (
  account: Account,
  addr: string,
  request: EthereumGasLimitRequest
) => Promise<BigNumber> = makeLRUCache(
  (account: Account, addr: string, request: EthereumGasLimitRequest) => {
    const api = apiForCurrency(account.currency);
    return api
      .getDryRunGasLimit(addr, request)
      .catch(() => api.roughlyEstimateGasLimit(addr));
  },
  (a, addr, r) =>
    a.id +
    "|" +
    addr +
    "|" +
    String(r.from) +
    "+" +
    String(r.to) +
    "+" +
    String(r.value) +
    "+" +
    String(r.data) +
    "+" +
    String(r.gasPrice) +
    "+" +
    String(r.amplifier)
);

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
};
