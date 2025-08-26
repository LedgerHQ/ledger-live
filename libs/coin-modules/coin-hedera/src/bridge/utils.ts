import BigNumber from "bignumber.js";
import murmurhash from "imurmurhash";
import invariant from "invariant";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import {
  findTokenByAddressInCurrency,
  getFiatCurrencyByTicker,
  listTokensForCryptoCurrency,
} from "@ledgerhq/cryptoassets";
import {
  decodeTokenAccountId,
  emptyHistoryCache,
  encodeTokenAccountId,
  findSubAccountById,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { CryptoCurrency, Currency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import type { HederaOperationExtra, Transaction } from "../types";
import { getAccount } from "../api/mirror";
import type { HederaMirrorToken } from "../api/types";
import { isTokenAssociateTransaction, isValidExtra } from "../logic";
import { BASE_USD_FEE_BY_OPERATION_TYPE, HEDERA_OPERATION_TYPES } from "../constants";

const ESTIMATED_FEE_SAFETY_RATE = 2;

// note: this is currently called frequently by getTransactionStatus; LRU cache prevents duplicated requests
export const getCurrencyToUSDRate = makeLRUCache(
  async (currency: Currency) => {
    try {
      const [rate] = await cvsApi.fetchLatest([
        {
          from: currency,
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(),
        },
      ]);

      invariant(rate, "no value returned from cvs api");

      return new BigNumber(rate);
    } catch {
      return null;
    }
  },
  currency => currency.ticker,
  seconds(3),
);

export const getEstimatedFees = async (
  account: Account,
  operationType: HEDERA_OPERATION_TYPES,
): Promise<BigNumber> => {
  try {
    const usdRate = await getCurrencyToUSDRate(account.currency);

    if (usdRate) {
      return new BigNumber(BASE_USD_FEE_BY_OPERATION_TYPE[operationType])
        .dividedBy(new BigNumber(usdRate))
        .integerValue(BigNumber.ROUND_CEIL)
        .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // as fees are based on a currency conversion, we stay
  // on the safe side here and double the estimate for "max spendable"
  return new BigNumber("150200").multipliedBy(ESTIMATED_FEE_SAFETY_RATE); // 0.001502 ℏ (as of 2023-03-14)
};

interface CalculateAmountResult {
  amount: BigNumber;
  totalSpent: BigNumber;
}

const calculateCoinAmount = async ({
  account,
  transaction,
  operationType,
}: {
  account: Account;
  transaction: Transaction;
  operationType: HEDERA_OPERATION_TYPES;
}): Promise<CalculateAmountResult> => {
  const estimatedFees = await getEstimatedFees(account, operationType);
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account, transaction })
    : transaction.amount;

  return {
    amount,
    totalSpent: amount.plus(estimatedFees),
  };
};

const calculateTokenAmount = async ({
  account,
  tokenAccount,
  transaction,
}: {
  account: Account;
  tokenAccount: TokenAccount;
  transaction: Transaction;
}): Promise<CalculateAmountResult> => {
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account: tokenAccount, parentAccount: account, transaction })
    : transaction.amount;

  return {
    amount,
    totalSpent: amount,
  };
};

export const calculateAmount = ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<CalculateAmountResult> => {
  const subAccount = findSubAccountById(account, transaction?.subAccountId || "");
  const isTokenTransaction = isTokenAccount(subAccount);

  if (isTokenTransaction) {
    return calculateTokenAmount({ account, tokenAccount: subAccount, transaction });
  }

  const operationType: HEDERA_OPERATION_TYPES = isTokenAssociateTransaction(transaction)
    ? HEDERA_OPERATION_TYPES.TokenAssociate
    : HEDERA_OPERATION_TYPES.CryptoTransfer;

  return calculateCoinAmount({ account, transaction, operationType });
};

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}

const simpleSyncHashMemoize: Record<string, string> = {};

export const getSyncHash = (
  currency: CryptoCurrency,
  blacklistedTokenIds: string[] = [],
): string => {
  const tokens = listTokensForCryptoCurrency(currency);

  const stringToHash =
    currency.id +
    tokens.map(token => token.id + token.contractAddress + token.name + token.ticker).join("") +
    blacklistedTokenIds.join("");

  if (!simpleSyncHashMemoize[stringToHash]) {
    simpleSyncHashMemoize[stringToHash] = `0x${murmurhash(stringToHash).result().toString(16)}`;
  }

  return simpleSyncHashMemoize[stringToHash];
};

export const getSubAccounts = async (
  accountId: string,
  lastTokenOperations: Operation[],
  mirrorTokens: HederaMirrorToken[],
): Promise<TokenAccount[]> => {
  // Creating a Map of Operations by TokenCurrencies in order to know which TokenAccounts should be synced as well
  const operationsByToken = lastTokenOperations.reduce<Map<TokenCurrency, Operation[]>>(
    (acc, tokenOperation) => {
      const { token } = decodeTokenAccountId(tokenOperation.accountId);
      if (!token) return acc;

      const isTokenListedInCAL = findTokenByAddressInCurrency(
        token.contractAddress,
        token.parentCurrency.id,
      );
      if (!isTokenListedInCAL) return acc;

      if (!acc.has(token)) {
        acc.set(token, []);
      }

      acc.get(token)?.push(tokenOperation);

      return acc;
    },
    new Map<TokenCurrency, Operation[]>(),
  );

  const subAccounts: TokenAccount[] = [];

  // extract token accounts from existing operations
  for (const [token, tokenOperations] of operationsByToken.entries()) {
    const parentAccountId = accountId;
    const rawBalance = mirrorTokens.find(t => t.token_id === token.contractAddress)?.balance;
    const balance = rawBalance !== undefined ? new BigNumber(rawBalance) : null;

    if (!balance) {
      continue;
    }

    subAccounts.push({
      type: "TokenAccount",
      id: encodeTokenAccountId(parentAccountId, token),
      parentId: parentAccountId,
      token,
      balance,
      spendableBalance: balance,
      creationDate:
        tokenOperations.length > 0 ? tokenOperations[tokenOperations.length - 1].date : new Date(),
      operations: tokenOperations,
      operationsCount: tokenOperations.length,
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
      swapHistory: [],
    });
  }

  // extract token accounts existing in the account's balance, but with no recorded operations yet
  // e.g. tokens added via association flow, without any subsequent activity
  for (const rawToken of mirrorTokens) {
    const parentAccountId = accountId;
    const rawBalance = rawToken.balance;
    const balance = new BigNumber(rawBalance);
    const token = findTokenByAddressInCurrency(rawToken.token_id, "hedera");

    if (!token) {
      continue;
    }

    const id = encodeTokenAccountId(parentAccountId, token);

    if (subAccounts.some(a => a.id === id)) {
      continue;
    }

    subAccounts.push({
      type: "TokenAccount",
      id: encodeTokenAccountId(parentAccountId, token),
      parentId: parentAccountId,
      token,
      balance,
      spendableBalance: balance,
      creationDate: new Date(parseFloat(rawToken.created_timestamp) * 1000),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
      swapHistory: [],
    });
  }

  return subAccounts;
};

type CoinOperationForOrphanChildOperation = Operation & Required<Pick<Operation, "subOperations">>;

// create NONE coin operation that will be a parent of an orphan child operation
const makeCoinOperationForOrphanChildOperation = (
  childOperation: Operation,
): CoinOperationForOrphanChildOperation => {
  const type = "NONE";
  const { accountId } = decodeTokenAccountId(childOperation.accountId);
  const id = encodeOperationId(accountId, childOperation.hash, type);

  return {
    id,
    hash: childOperation.hash,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: childOperation.blockHeight,
    blockHash: childOperation.blockHash,
    transactionSequenceNumber: childOperation.transactionSequenceNumber,
    subOperations: [],
    nftOperations: [],
    internalOperations: [],
    accountId: "",
    date: childOperation.date,
    extra: {},
  };
};

// this util handles:
// - linking sub operations with coin operations, e.g. token transfer with fee payment
// - if possible, assigning `extra.associatedTokenId = mirrorToken.tokenId` based on operation's consensus timestamp
export const prepareOperations = (
  coinOperations: Operation[],
  tokenOperations: Operation[],
  mirrorTokens: HederaMirrorToken[],
): Operation[] => {
  const preparedCoinOperations = coinOperations.map(op => ({ ...op }));
  const preparedTokenOperations = tokenOperations.map(op => ({ ...op }));

  // loop through coin operations to:
  // - enrich ASSOCIATE_TOKEN operations with extra.associatedTokenId
  // - prepare a map of hash => operations
  const coinOperationsByHash: Record<string, CoinOperationForOrphanChildOperation[]> = {};
  preparedCoinOperations.forEach(op => {
    const extra = isValidExtra(op.extra) ? op.extra : null;

    if (op.type === "ASSOCIATE_TOKEN" && extra?.consensusTimestamp) {
      const relatedMirrorToken = mirrorTokens.find(t => {
        return t.created_timestamp === extra.consensusTimestamp;
      });

      if (relatedMirrorToken) {
        op.extra = {
          ...extra,
          associatedTokenId: relatedMirrorToken.token_id,
        } satisfies HederaOperationExtra;
      }
    }

    if (!coinOperationsByHash[op.hash]) {
      coinOperationsByHash[op.hash] = [];
    }

    op.subOperations = [];
    coinOperationsByHash[op.hash].push(op as CoinOperationForOrphanChildOperation);
  });

  // loop through token operations to potentially copy them as a child operation of a coin operation
  for (const tokenOperation of preparedTokenOperations) {
    const { token } = decodeTokenAccountId(tokenOperation.accountId);
    if (!token) continue;

    let mainOperations = coinOperationsByHash[tokenOperation.hash];

    if (!mainOperations?.length) {
      const noneOperation = makeCoinOperationForOrphanChildOperation(tokenOperation);
      mainOperations = [noneOperation];
      preparedCoinOperations.push(noneOperation);
    }

    // ugly loop in loop but in theory, this can only be a 2 elements array maximum in the case of a self send
    for (const mainOperation of mainOperations) {
      mainOperation.subOperations.push(tokenOperation);
    }
  }

  return preparedCoinOperations;
};

/**
 * List of properties of a sub account that can be updated when 2 "identical" accounts are found
 */
const updatableSubAccountProperties = [
  { name: "balance", isOps: false },
  { name: "spendableBalance", isOps: false },
  { name: "balanceHistoryCache", isOps: false },
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
] as const satisfies { name: string; isOps: boolean }[];

/**
 * In charge of smartly merging sub accounts while maintaining references as much as possible
 */
export const mergeSubAccounts = (
  initialAccount: Account | undefined,
  newSubAccounts: TokenAccount[],
): Array<TokenAccount> => {
  const oldSubAccounts: Array<TokenAccount> | undefined = initialAccount?.subAccounts;

  if (!oldSubAccounts) {
    return newSubAccounts;
  }

  // map of already existing sub accounts by id
  const oldSubAccountsById: Record<string, TokenAccount> = {};
  for (const oldSubAccount of oldSubAccounts) {
    oldSubAccountsById[oldSubAccount.id] = oldSubAccount;
  }

  // looping through new sub accounts to compare them with already existing ones
  // already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: TokenAccount[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: TokenAccount | undefined = oldSubAccountsById[newSubAccount.id];

    if (!duplicatedAccount) {
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    const updates: Partial<TokenAccount> = {};
    for (const { name, isOps } of updatableSubAccountProperties) {
      if (!isOps) {
        if (newSubAccount[name] !== duplicatedAccount[name]) {
          // @ts-expect-error - TypeScript assumes all possible types could be assigned here
          updates[name] = newSubAccount[name];
        }
      } else {
        updates[name] = mergeOps(duplicatedAccount[name], newSubAccount[name]);
      }
    }

    // update the operationsCount in case the mergeOps changed it
    updates.operationsCount =
      updates.operations?.length || duplicatedAccount?.operations?.length || 0;

    // modify the map with the updated sub account with a new ref
    oldSubAccountsById[newSubAccount.id!] = {
      ...duplicatedAccount,
      ...updates,
    };
  }

  const updatedSubAccounts = Object.values(oldSubAccountsById);

  return [...updatedSubAccounts, ...newSubAccountsToAdd];
};

export const applyPendingExtras = (existing: Operation[], pending: Operation[]) => {
  const pendingOperationsByHash = new Map(pending.map(op => [op.hash, op]));

  return existing.map(op => {
    const pendingOp = pendingOperationsByHash.get(op.hash);
    if (!pendingOp) return op;
    if (!isValidExtra(op.extra)) return op;
    if (!isValidExtra(pendingOp.extra)) return op;

    return {
      ...op,
      extra: {
        ...pendingOp.extra,
        ...op.extra,
      },
    };
  });
};

export function patchOperationWithExtra(
  operation: Operation,
  extra: HederaOperationExtra,
): Operation {
  return {
    ...operation,
    extra,
    subOperations: (operation.subOperations ?? []).map(op => ({ ...op, extra })),
    nftOperations: (operation.nftOperations ?? []).map(op => ({ ...op, extra })),
  };
}

export const checkAccountTokenAssociationStatus = makeLRUCache(
  async (accountId: string, tokenId: string) => {
    const mirrorAccount = await getAccount(accountId);

    // auto association is enabled
    if (mirrorAccount.max_automatic_token_associations === -1) {
      return true;
    }

    const isTokenAssociated = mirrorAccount.balance.tokens.some(token => {
      return token.token_id === tokenId;
    });

    return isTokenAssociated;
  },
  (accountId, tokenId) => `${accountId}-${tokenId}`,
  seconds(30),
);
