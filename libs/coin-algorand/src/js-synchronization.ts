import {
  emptyHistoryCache,
  encodeAccountId,
  inferSubOperations,
} from "@ledgerhq/coin-framework/account/index";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  findTokenById,
  listTokensForCryptoCurrency,
} from "@ledgerhq/coin-framework/currencies/index";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { BigNumber } from "bignumber.js";

import type {
  AlgoAsset,
  AlgoAssetTransferInfo,
  AlgoPaymentInfo,
  AlgoTransaction,
  AlgorandAPI,
} from "./api";

import { AlgoTransactionType } from "./api";

import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  Operation,
  OperationType,
  SyncConfig,
  TokenAccount,
} from "@ledgerhq/types-live";
import { computeAlgoMaxSpendable } from "./logic";
import { addPrefixToken, extractTokenId } from "./tokens";

const getASAOperationAmount = (transaction: AlgoTransaction, accountAddress: string): BigNumber => {
  let assetAmount = new BigNumber(0);
  if (transaction.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = transaction.details as AlgoAssetTransferInfo;
    const assetSender = details.assetSenderAddress
      ? details.assetSenderAddress
      : transaction.senderAddress;

    // Account is either sender or recipient (if both the balance is unchanged)
    if ((assetSender === accountAddress) !== (details.assetRecipientAddress == accountAddress)) {
      assetAmount = assetAmount.plus(details.assetAmount);
    }
    // Account is either sender or close-to, but not both
    if (
      (assetSender === accountAddress) !==
      (details.assetCloseToAddress && details.assetCloseToAddress === accountAddress)
    ) {
      if (details.assetCloseAmount) {
        assetAmount = assetAmount.plus(details.assetCloseAmount);
      }
    }
  }
  return assetAmount;
};

const getOperationAmounts = (
  transaction: AlgoTransaction,
  accountAddress: string,
): { amount: BigNumber; rewards: BigNumber } => {
  let amount = new BigNumber(0);
  let rewards = new BigNumber(0);

  if (transaction.senderAddress === accountAddress) {
    const senderRewards = transaction.senderRewards;
    amount = amount.minus(senderRewards).plus(transaction.fee);
    rewards = rewards.plus(senderRewards);
  }

  if (transaction.type === AlgoTransactionType.PAYMENT) {
    const details = transaction.details as AlgoPaymentInfo;
    if (transaction.senderAddress == details.recipientAddress) {
      return {
        amount,
        rewards,
      };
    }
    if (transaction.senderAddress === accountAddress) {
      amount = amount.plus(details.amount);
    }
    if (details.recipientAddress == accountAddress) {
      const recipientRewards = transaction.recipientRewards;
      amount = amount.plus(details.amount).plus(recipientRewards);
      rewards = rewards.plus(recipientRewards);
    }
    if (
      transaction.closeRewards &&
      details.closeAmount &&
      details.closeToAddress === accountAddress
    ) {
      const closeRewards = transaction.closeRewards;
      amount = amount.plus(details.closeAmount).plus(closeRewards);
      rewards = rewards.plus(closeRewards);
    }
  }

  return {
    amount,
    rewards,
  };
};

const getASAOperationType = (
  transaction: AlgoTransaction,
  accountAddress: string,
): OperationType => {
  return transaction.senderAddress === accountAddress ? "OUT" : "IN";
};

const getOperationType = (transaction: AlgoTransaction, accountAddress: string): OperationType => {
  if (transaction.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = transaction.details as AlgoAssetTransferInfo;
    if (
      details.assetAmount.isZero() &&
      transaction.senderAddress == details.assetRecipientAddress
    ) {
      return "OPT_IN";
    } else if (details.assetCloseToAddress && transaction.senderAddress == accountAddress) {
      return "OPT_OUT";
    } else {
      return "FEES";
    }
  }

  return transaction.senderAddress === accountAddress ? "OUT" : "IN";
};

const getOperationSenders = (transaction: AlgoTransaction): string[] => {
  return [transaction.senderAddress];
};

const getOperationRecipients = (transaction: AlgoTransaction): string[] => {
  const recipients: string[] = [];
  if (transaction.type === AlgoTransactionType.PAYMENT) {
    const details = transaction.details as AlgoPaymentInfo;
    recipients.push(details.recipientAddress);
    if (details.closeToAddress) {
      recipients.push(details.closeToAddress);
    }
  } else if (transaction.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = transaction.details as AlgoAssetTransferInfo;

    recipients.push(details.assetRecipientAddress);
    if (details.assetCloseToAddress) {
      recipients.push(details.assetCloseToAddress);
    }
  }
  return recipients;
};

const getOperationAssetId = (transaction: AlgoTransaction): string | undefined => {
  if (transaction.type === AlgoTransactionType.ASSET_TRANSFER) {
    const details = transaction.details as AlgoAssetTransferInfo;
    return details.assetId;
  }
};

const mapTransactionToOperation = (
  tx: AlgoTransaction,
  accountId: string,
  accountAddress: string,
  subAccounts?: TokenAccount[],
): Partial<Operation> => {
  const hash = tx.id;
  const blockHeight = tx.round;
  const date = new Date(parseInt(tx.timestamp) * 1000);
  const fee = tx.fee;
  const memo = tx.note;
  const senders: string[] = getOperationSenders(tx);
  const recipients: string[] = getOperationRecipients(tx);
  const { amount, rewards } = getOperationAmounts(tx, accountAddress);
  const type = getOperationType(tx, accountAddress);
  const assetId = getOperationAssetId(tx);

  const subOperations = subAccounts ? inferSubOperations(tx.id, subAccounts) : undefined;

  return {
    id: encodeOperationId(accountId, hash, type),
    hash,
    date,
    type,
    value: amount,
    fee,
    senders,
    recipients,
    blockHeight,
    accountId,
    subOperations,
    extra: {
      rewards,
      memo,
      assetId,
    },
  };
};

const mapTransactionToASAOperation = (
  tx: AlgoTransaction,
  accountId: string,
  accountAddress: string,
): Partial<Operation> => {
  const hash = tx.id;
  const blockHeight = tx.round;
  const date = new Date(parseInt(tx.timestamp) * 1000);
  const fee = tx.fee;
  const senders: string[] = getOperationSenders(tx);
  const recipients: string[] = getOperationRecipients(tx);
  const type = getASAOperationType(tx, accountAddress);
  const amount = getASAOperationAmount(tx, accountAddress);

  return {
    id: encodeOperationId(accountId, hash, type),
    hash,
    date,
    type,
    value: amount,
    fee,
    senders,
    recipients,
    blockHeight,
    accountId,
    extra: {},
  };
};

export function makeGetAccountShape(algorandAPI: AlgorandAPI): GetAccountShape {
  return async (info, syncConfig): Promise<Partial<Account>> => {
    const { address, initialAccount, currency, derivationMode } = info;
    const oldOperations = initialAccount?.operations || [];
    const startAt = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const { round, balance, pendingRewards, assets } = await algorandAPI.getAccount(address);

    const nbAssets = assets.length;

    // NOTE Actual spendable amount depends on the transaction
    const spendableBalance = computeAlgoMaxSpendable({
      accountBalance: balance,
      nbAccountAssets: nbAssets,
      mode: "send",
    });

    const newTransactions: AlgoTransaction[] = await algorandAPI.getAccountTransactions(
      address,
      startAt,
    );

    const subAccounts = await buildSubAccounts({
      currency,
      accountId,
      initialAccount,
      initialAccountAddress: address,
      assets,
      newTransactions,
      syncConfig,
    });

    const newOperations = newTransactions.map(tx =>
      mapTransactionToOperation(tx, accountId, address, subAccounts),
    );

    const operations = mergeOps(oldOperations, newOperations as Operation[]);

    const shape = {
      id: accountId,
      xpub: address,
      blockHeight: round,
      balance,
      spendableBalance,
      operations,
      operationsCount: operations.length,
      subAccounts,
      algorandResources: {
        rewards: pendingRewards,
        nbAssets,
      },
    };
    return shape;
  };
}

async function buildSubAccount({
  parentAccountId,
  parentAccountAddress,
  token,
  initialTokenAccount,
  newTransactions,
  balance,
}: {
  parentAccountId: string;
  parentAccountAddress: string;
  token: TokenCurrency;
  initialTokenAccount: TokenAccount;
  newTransactions: AlgoTransaction[];
  balance: BigNumber;
}) {
  const extractedId = extractTokenId(token.id);
  const tokenAccountId = parentAccountId + "+" + extractedId;

  const oldOperations = initialTokenAccount?.operations || [];

  const newOperations = newTransactions
    .filter(tx => tx.type === AlgoTransactionType.ASSET_TRANSFER)
    .filter(tx => {
      const details = tx.details as AlgoAssetTransferInfo;
      return Number(details.assetId) === Number(extractedId);
    })
    .filter(tx => getOperationType(tx, parentAccountAddress) != "OPT_IN")
    .map(tx => mapTransactionToASAOperation(tx, tokenAccountId, parentAccountAddress));

  const operations = mergeOps(oldOperations, newOperations as Operation[]);

  const tokenAccount: TokenAccount = {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance,
    spendableBalance: balance,
    swapHistory: [],
    creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };
  return tokenAccount;
}

async function buildSubAccounts({
  currency,
  accountId,
  initialAccount,
  initialAccountAddress,
  assets,
  newTransactions,
  syncConfig,
}: {
  currency: CryptoCurrency;
  accountId: string;
  initialAccount: Account | null | undefined;
  initialAccountAddress: string;
  assets: AlgoAsset[];
  newTransactions: AlgoTransaction[];
  syncConfig: SyncConfig;
}): Promise<TokenAccount[] | undefined> {
  const { blacklistedTokenIds = [] } = syncConfig;
  if (listTokensForCryptoCurrency(currency).length === 0) return undefined;
  const tokenAccounts: TokenAccount[] = [];
  const existingAccountByTicker: { [ticker: string]: TokenAccount } = {}; // used for fast lookup
  const existingAccountTickers: string[] = []; // used to keep track of ordering

  if (initialAccount && initialAccount.subAccounts) {
    for (const existingSubAccount of initialAccount.subAccounts) {
      if (existingSubAccount.type === "TokenAccount") {
        const { ticker, id } = existingSubAccount.token;

        if (!blacklistedTokenIds.includes(id)) {
          existingAccountTickers.push(ticker);
          existingAccountByTicker[ticker] = existingSubAccount;
        }
      }
    }
  }

  // filter by token existence
  await promiseAllBatched(3, assets, async asset => {
    const token = findTokenById(addPrefixToken(asset.assetId));

    if (token && !blacklistedTokenIds.includes(token.id)) {
      const initialTokenAccount = existingAccountByTicker[token.ticker];
      const tokenAccount = await buildSubAccount({
        parentAccountId: accountId,
        parentAccountAddress: initialAccountAddress,
        initialTokenAccount,
        token,
        newTransactions,
        balance: asset.balance,
      });
      if (tokenAccount) tokenAccounts.push(tokenAccount);
    }
  });
  // Preserve order of tokenAccounts from the existing token accounts
  tokenAccounts.sort((a, b) => {
    const i = existingAccountTickers.indexOf(a.token.ticker);
    const j = existingAccountTickers.indexOf(b.token.ticker);
    if (i === j) return 0;
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  });
  return tokenAccounts;
}
