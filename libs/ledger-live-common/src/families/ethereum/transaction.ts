import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type {
  Transaction,
  TransactionRaw,
  EthereumGasLimitRequest,
  TransactionStatus,
} from "./types";
import Common from "@ethereumjs/common";
import { Transaction as EthereumTx } from "@ethereumjs/tx";
import eip55 from "eip55";
import {
  InvalidAddress,
  ETHAddressNonEIP,
  RecipientRequired,
} from "@ledgerhq/errors";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "../../transaction/common";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { apiForCurrency } from "../../api/Ethereum";
import { makeLRUCache } from "../../cache";
import { getEnv } from "../../env";
import { modes } from "./modules";
import { fromRangeRaw, toRangeRaw } from "../../range";
export function isRecipientValid(_currency: CryptoCurrency, recipient: string) {
  if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) return false;
  // To handle non-eip55 addresses we stop validation here if we detect
  // address is either full upper or full lower.
  // see https://github.com/LedgerHQ/ledger-live-desktop/issues/1397
  const slice = recipient.substr(2);
  const isFullUpper = slice === slice.toUpperCase();
  const isFullLower = slice === slice.toLowerCase();
  if (isFullUpper || isFullLower) return true;

  try {
    return eip55.verify(recipient);
  } catch (error) {
    return false;
  }
}
// Returns a warning if we detect a non-eip address
export function getRecipientWarning(
  currency: CryptoCurrency,
  recipient: string
) {
  if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) return null;
  const slice = recipient.substr(2);
  const isFullUpper = slice === slice.toUpperCase();
  const isFullLower = slice === slice.toLowerCase();

  if (isFullUpper || isFullLower) {
    return new ETHAddressNonEIP();
  }

  return null;
}
export function validateRecipient(
  currency: CryptoCurrency,
  recipient: string,
  { errors, warnings }: TransactionStatus
) {
  const recipientWarning = getRecipientWarning(currency, recipient);

  if (recipientWarning) {
    warnings.recipient = recipientWarning;
  }

  if (!recipient) {
    errors.recipient = new RecipientRequired("");
  } else if (!isRecipientValid(currency, recipient)) {
    errors.recipient = new InvalidAddress("", {
      currencyName: currency.name,
    });
  }
}
export const formatTransaction = (
  t: Transaction,
  mainAccount: Account
): string => {
  const gasLimit = getGasLimit(t);
  const account =
    (t.subAccountId &&
      (mainAccount.subAccounts || []).find((a) => a.id === t.subAccountId)) ||
    mainAccount;

  const header = (() => {
    switch (t.mode) {
      case "erc721.transfer":
        return `${t.mode.toUpperCase()} Collection: ${t.collection} (${
          t.collectionName || ""
        }) TokenId: ${t.tokenIds?.[0]}`;
      case "erc1155.transfer":
        return (
          `${t.mode.toUpperCase()} Collection: ${t.collection} (${
            t.collectionName || ""
          })` +
          t.tokenIds
            ?.map((tokenId, index) => {
              return `\n  - TokenId: ${tokenId} Quantity: ${
                t.quantities?.[index]?.toFixed() ?? 0
              }`;
            })
            .join(",")
        );
      default:
        return `${t.mode.toUpperCase()} ${
          t.useAllAmount
            ? "MAX"
            : formatCurrencyUnit(getAccountUnit(account), t.amount, {
                showCode: true,
                disableRounding: true,
              })
        }`;
    }
  })();

  return `
${header}
TO ${t.recipient}
with gasPrice=${formatCurrencyUnit(
    mainAccount.currency.units[1] || mainAccount.currency.units[0],
    t.gasPrice || new BigNumber(0)
  )}
with gasLimit=${gasLimit.toString()}`;
};

const defaultGasLimit = new BigNumber(0x5208);
export const getGasLimit = (t: Transaction): BigNumber =>
  t.userGasLimit || t.estimatedGasLimit || defaultGasLimit;
export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { networkInfo } = tr;
  return {
    ...common,
    mode: tr.mode,
    nonce: tr.nonce,
    data: tr.data ? Buffer.from(tr.data, "hex") : undefined,
    family: tr.family,
    gasPrice: tr.gasPrice ? new BigNumber(tr.gasPrice) : null,
    userGasLimit: tr.userGasLimit ? new BigNumber(tr.userGasLimit) : null,
    estimatedGasLimit: tr.estimatedGasLimit
      ? new BigNumber(tr.estimatedGasLimit)
      : null,
    feeCustomUnit: tr.feeCustomUnit,
    // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: fromRangeRaw(networkInfo.gasPrice),
    },
    allowZeroAmount: tr.allowZeroAmount,
    feesStrategy: tr.feesStrategy,
    tokenIds: tr.tokenIds,
    collection: tr.collection,
    collectionName: tr.collectionName,
    quantities: tr.quantities?.map((q) => new BigNumber(q)),
  };
};
export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { networkInfo } = t;
  return {
    ...common,
    mode: t.mode,
    nonce: t.nonce,
    family: t.family,
    data: t.data ? t.data.toString("hex") : undefined,
    gasPrice: t.gasPrice ? t.gasPrice.toString() : null,
    userGasLimit: t.userGasLimit ? t.userGasLimit.toString() : null,
    estimatedGasLimit: t.estimatedGasLimit
      ? t.estimatedGasLimit.toString()
      : null,
    feeCustomUnit: t.feeCustomUnit,
    // FIXME drop?
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: toRangeRaw(networkInfo.gasPrice),
    },
    allowZeroAmount: t.allowZeroAmount,
    feesStrategy: t.feesStrategy,
    tokenIds: t.tokenIds,
    collection: t.collection,
    collectionName: t.collectionName,
    quantities: t.quantities?.map((q) => q.toString()),
  };
};

// see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
function getEthereumjsTxCommon(currency) {
  const { ethereumLikeInfo } = currency;
  invariant(
    ethereumLikeInfo,
    `currency ${currency.id} did not set ethereumLikeInfo`
  );
  if (ethereumLikeInfo.chainId === 1) {
    return new Common({
      chain: ethereumLikeInfo.baseChain || "mainnet",
      hardfork: ethereumLikeInfo.hardfork || "petersburg",
    });
  }
  return Common.forCustomChain(
    ethereumLikeInfo.baseChain || "mainnet",
    {
      name: currency.ticker,
      chainId: ethereumLikeInfo.chainId,
      networkId: ethereumLikeInfo.networkId || ethereumLikeInfo.chainId,
    },
    ethereumLikeInfo.hardfork || "petersburg"
  );
}

export function inferTokenAccount(a: Account, t: Transaction) {
  const tokenAccount = !t.subAccountId
    ? null
    : a.subAccounts && a.subAccounts.find((ta) => ta.id === t.subAccountId);

  if (tokenAccount && tokenAccount.type === "TokenAccount") {
    return tokenAccount;
  }
}
export function buildEthereumTx(
  account: Account,
  transaction: Transaction,
  nonce: number
) {
  const { currency } = account;
  const { gasPrice } = transaction;
  const subAccount = inferTokenAccount(account, transaction);
  invariant(
    !subAccount || subAccount.type === "TokenAccount",
    "only token accounts expected"
  );
  const common = getEthereumjsTxCommon(currency);
  if (!common) {
    throw new Error(`common not found for currency ${currency.name}`);
  }
  const gasLimit = getGasLimit(transaction);
  const ethTxObject: Record<string, any> = {
    nonce,
    gasPrice: `0x${new BigNumber(gasPrice || 0).toString(16)}`,
    gasLimit: `0x${new BigNumber(gasLimit).toString(16)}`,
  };
  const m = modes[transaction.mode];
  invariant(m, "missing module for mode=" + transaction.mode);
  const fillTransactionDataResult = m.fillTransactionData(
    account,
    transaction,
    ethTxObject
  );
  log("ethereum", "buildEthereumTx", ethTxObject);
  const tx = new EthereumTx(ethTxObject, { common });
  return {
    tx,
    common,
    ethTxObject,
    fillTransactionDataResult,
  };
}
export function inferEthereumGasLimitRequest(
  account: Account,
  transaction: Transaction
): EthereumGasLimitRequest {
  const r: EthereumGasLimitRequest = {
    from: account.freshAddress,
    amplifier: "1",
  };

  if (transaction.gasPrice) {
    r.gasPrice = "0x" + transaction.gasPrice.toString();
  }

  try {
    const { data, to, value } = buildEthereumTx(account, transaction, 1).tx;

    if (value) {
      r.value = "0x" + (value.toString("hex") || "0");
    }

    if (to) {
      r.to = to.toString();
    }

    if (data) {
      r.data = "0x" + data.toString("hex");
    }
  } catch (e) {
    log("warn", "couldn't serializeTransactionData: " + e);
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
      .then((value) =>
        value.eq(21000) // regular ETH send should not be amplified
          ? value
          : value.times(getEnv("ETHEREUM_GAS_LIMIT_AMPLIFIER")).integerValue()
      )
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
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
