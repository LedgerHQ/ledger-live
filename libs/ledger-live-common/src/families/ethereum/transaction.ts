import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { log } from "@ledgerhq/logs";
import type { Transaction, TransactionRaw } from "./types";
import Common from "@ethereumjs/common";
import {
  Transaction as LegacyTransaction,
  FeeMarketEIP1559Transaction as EIP1559Transaction,
  FeeMarketEIP1559TxData,
} from "@ethereumjs/tx";
import {
  formatTransactionStatusCommon as formatTransactionStatus,
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/transaction/common";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountUnit } from "../../account";
import { formatCurrencyUnit } from "../../currencies";
import { getEnv } from "../../env";
import { ModeModule, modes } from "./modules";
import { fromRangeRaw, toRangeRaw } from "../../range";
import { getDefaultFeeUnit } from "./logic";

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

  let feesMessage: string;
  if (EIP1559ShouldBeUsed(mainAccount.currency)) {
    feesMessage =
      `with maxFeePerGas=${formatCurrencyUnit(
        getDefaultFeeUnit(mainAccount.currency),
        t.maxFeePerGas || new BigNumber(0)
      )}\n` +
      `with maxPriorityFeePerGas=${formatCurrencyUnit(
        getDefaultFeeUnit(mainAccount.currency),
        t.maxPriorityFeePerGas || new BigNumber(0)
      )}`;
  } else {
    feesMessage = `with gasPrice=${formatCurrencyUnit(
      getDefaultFeeUnit(mainAccount.currency),
      t.gasPrice || new BigNumber(0)
    )}`;
  }

  return `
${header}
TO ${t.recipient}
${feesMessage}
with gasLimit=${gasLimit.toString()}`;
};

const defaultGasLimit = new BigNumber(21000);
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
    maxFeePerGas: tr.maxFeePerGas ? new BigNumber(tr.maxFeePerGas) : null,
    maxPriorityFeePerGas: tr.maxPriorityFeePerGas
      ? new BigNumber(tr.maxPriorityFeePerGas)
      : null,
    userGasLimit: tr.userGasLimit ? new BigNumber(tr.userGasLimit) : null,
    estimatedGasLimit: tr.estimatedGasLimit
      ? new BigNumber(tr.estimatedGasLimit)
      : null,
    feeCustomUnit: tr.feeCustomUnit,
    // FIXME this is not good.. we're dereferencing here. we should instead store an index (to lookup in currency.units on UI)
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: networkInfo.gasPrice
        ? fromRangeRaw(networkInfo.gasPrice)
        : undefined,
      nextBaseFeePerGas: networkInfo.nextBaseFeePerGas
        ? new BigNumber(networkInfo.nextBaseFeePerGas)
        : undefined,
      maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas
        ? fromRangeRaw(networkInfo.maxPriorityFeePerGas)
        : undefined,
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
    maxFeePerGas: t.maxFeePerGas ? t.maxFeePerGas.toString() : null,
    maxPriorityFeePerGas: t.maxPriorityFeePerGas
      ? t.maxPriorityFeePerGas.toString()
      : null,
    userGasLimit: t.userGasLimit ? t.userGasLimit.toString() : null,
    estimatedGasLimit: t.estimatedGasLimit
      ? t.estimatedGasLimit.toString()
      : null,
    feeCustomUnit: t.feeCustomUnit,
    // FIXME drop?
    networkInfo: networkInfo && {
      family: networkInfo.family,
      gasPrice: networkInfo.gasPrice
        ? toRangeRaw(networkInfo.gasPrice)
        : undefined,
      nextBaseFeePerGas: networkInfo.nextBaseFeePerGas
        ? networkInfo.nextBaseFeePerGas.toString()
        : undefined,
      maxPriorityFeePerGas: networkInfo.maxPriorityFeePerGas
        ? toRangeRaw(networkInfo.maxPriorityFeePerGas)
        : undefined,
    },
    allowZeroAmount: t.allowZeroAmount,
    feesStrategy: t.feesStrategy,
    tokenIds: t.tokenIds,
    collection: t.collection,
    collectionName: t.collectionName,
    quantities: t.quantities?.map((q) => q?.toFixed() || "0"),
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
      hardfork: ethereumLikeInfo.hardfork || "london",
    });
  }
  return Common.custom({
    name: ethereumLikeInfo.baseChain || "mainnet",
    chainId: ethereumLikeInfo.chainId,
    networkId: ethereumLikeInfo.networkId || ethereumLikeInfo.chainId,
    defaultHardfork: ethereumLikeInfo.hardfork || "london",
  });
}

export function EIP1559ShouldBeUsed(currency: CryptoCurrency): boolean {
  return getEnv("EIP1559_ENABLED_CURRENCIES").includes(currency.id);
}

export function inferTokenAccount(
  a: Account,
  t: Transaction
): TokenAccount | undefined {
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
): {
  tx: EIP1559Transaction | LegacyTransaction;
  common: Common;
  ethTxObject: {
    nonce: number;
    gasLimit: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  fillTransactionDataResult: ReturnType<ModeModule["fillTransactionData"]>;
} {
  const { currency } = account;
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = transaction;
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
  const ethTxObject: {
    nonce: number;
    gasLimit: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  } = {
    nonce,
    gasLimit: `0x${new BigNumber(gasLimit).toString(16)}`,
  };

  const mode = modes[transaction.mode];
  invariant(mode, "missing module for mode=" + transaction.mode);

  const fillTransactionDataResult = mode.fillTransactionData(
    account,
    transaction,
    ethTxObject
  );

  let tx: EIP1559Transaction | LegacyTransaction;
  if (EIP1559ShouldBeUsed(currency)) {
    ethTxObject.maxFeePerGas = `0x${new BigNumber(maxFeePerGas || 0).toString(
      16
    )}`;
    ethTxObject.maxPriorityFeePerGas = `0x${new BigNumber(
      maxPriorityFeePerGas || 0
    ).toString(16)}`;
    log("ethereum", "buildEIP1559Transaction", ethTxObject);
    tx = new EIP1559Transaction(ethTxObject as FeeMarketEIP1559TxData, {
      common,
    });
  } else {
    ethTxObject.gasPrice = `0x${new BigNumber(gasPrice || 0).toString(16)}`;
    log("ethereum", "buildLegacyEthereumTransaction", ethTxObject);
    tx = new LegacyTransaction(ethTxObject, { common });
  }

  return {
    tx,
    common,
    ethTxObject,
    fillTransactionDataResult,
  };
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
