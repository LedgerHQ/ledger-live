import BigNumber from "bignumber.js";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import {
  decodeTokenAccountId,
  emptyHistoryCache,
  encodeTokenAccountId,
  findSubAccountById,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { estimateFees } from "../logic/estimateFees";
import {
  fromEVMAddress,
  toEVMAddress,
  getMemoFromBase64,
  isTokenAssociateTransaction,
  isValidExtra,
  base64ToUrlSafeBase64,
} from "../logic/utils";
import { parseThirdwebTransactionParams } from "../network/utils";
import type {
  HederaOperationExtra,
  Transaction,
  OperationERC20,
  HederaMirrorToken,
  HederaERC20TokenBalance,
  ERC20OperationFields,
} from "../types";

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
  operationType: Exclude<HEDERA_OPERATION_TYPES, HEDERA_OPERATION_TYPES.ContractCall>;
}): Promise<CalculateAmountResult> => {
  const estimatedFees = await estimateFees({ currency: account.currency, operationType });
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account, transaction })
    : transaction.amount;

  return {
    amount,
    totalSpent: amount.plus(estimatedFees.tinybars),
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

export const getSubAccounts = async ({
  ledgerAccountId,
  latestHTSTokenOperations,
  latestERC20TokenOperations,
  mirrorTokens,
  erc20Tokens,
}: {
  ledgerAccountId: string;
  latestHTSTokenOperations: Operation[];
  latestERC20TokenOperations: Operation[];
  mirrorTokens: HederaMirrorToken[];
  erc20Tokens: HederaERC20TokenBalance[];
}): Promise<TokenAccount[]> => {
  // Creating a Map of Operations by TokenCurrencies in order to know which TokenAccounts should be synced as well
  const operationsByToken = new Map<TokenCurrency, Operation[]>();
  const subAccounts: TokenAccount[] = [];

  for (const tokenOperation of [...latestHTSTokenOperations, ...latestERC20TokenOperations]) {
    const { token } = await decodeTokenAccountId(tokenOperation.accountId);
    if (!token) continue;

    const isTokenListedInCAL = await getCryptoAssetsStore().findTokenByAddressInCurrency(
      token.contractAddress,
      token.parentCurrency.id,
    );
    if (!isTokenListedInCAL) continue;

    if (!operationsByToken.has(token)) {
      operationsByToken.set(token, []);
    }

    operationsByToken.get(token)?.push(tokenOperation);
  }

  // extract token accounts from existing operations
  for (const [token, tokenOperations] of operationsByToken.entries()) {
    const parentAccountId = ledgerAccountId;
    let balance: BigNumber | null = null;

    if (token.tokenType === "erc20") {
      const rawBalance = erc20Tokens.find(t => t.token.contractAddress === token.contractAddress);
      balance = rawBalance === undefined ? null : new BigNumber(rawBalance.balance);
    } else {
      const rawBalance = mirrorTokens.find(t => t.token_id === token.contractAddress)?.balance;
      balance = rawBalance === undefined ? null : new BigNumber(rawBalance);
    }

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
  // e.g. hts tokens added via association flow, without any subsequent activity
  // or erc20 tokens received from 3rd party
  for (const rawToken of [...mirrorTokens, ...erc20Tokens]) {
    const parentAccountId = ledgerAccountId;
    const rawBalance = rawToken.balance;
    const balance = new BigNumber(rawBalance);
    const isERC20 = "token" in rawToken;
    const tokenAddress = isERC20 ? rawToken.token.contractAddress : rawToken.token_id;
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenAddress, "hedera");

    if (!token) {
      continue;
    }

    const id = encodeTokenAccountId(parentAccountId, token);
    const operations = operationsByToken.get(token) ?? [];

    if (subAccounts.some(a => a.id === id)) {
      continue;
    }

    if (isERC20 && operations.length === 0 && balance.isZero()) {
      continue;
    }

    subAccounts.push({
      type: "TokenAccount",
      id,
      parentId: parentAccountId,
      token,
      balance,
      spendableBalance: balance,
      creationDate: isERC20
        ? new Date()
        : new Date(Number.parseFloat(rawToken.created_timestamp) * 1000),
      operations: [],
      operationsCount: 0,
      pendingOperations: [],
      balanceHistoryCache: emptyHistoryCache,
      swapHistory: [],
    });
  }

  return subAccounts;
};

type CoinOperationForOrphanChildOperation = Operation<HederaOperationExtra> &
  Required<Pick<Operation, "subOperations">>;

// create NONE coin operation that will be a parent of an orphan child operation
const makeCoinOperationForOrphanChildOperation = async (
  childOperation: Operation<HederaOperationExtra>,
): Promise<CoinOperationForOrphanChildOperation> => {
  const type = "NONE";
  const { accountId } = await decodeTokenAccountId(childOperation.accountId);
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
export const prepareOperations = async (
  coinOperations: Operation<HederaOperationExtra>[],
  tokenOperations: Operation<HederaOperationExtra>[],
): Promise<Operation<HederaOperationExtra>[]> => {
  const preparedCoinOperations = coinOperations.map(op => ({ ...op }));
  const preparedTokenOperations = tokenOperations.map(op => ({ ...op }));

  // loop through coin operations to prepare a map of hash => operations
  const coinOperationsByHash: Record<string, CoinOperationForOrphanChildOperation[]> = {};
  preparedCoinOperations.forEach(op => {
    if (!coinOperationsByHash[op.hash]) {
      coinOperationsByHash[op.hash] = [];
    }

    op.subOperations = [];
    coinOperationsByHash[op.hash].push(op as CoinOperationForOrphanChildOperation);
  });

  // loop through token operations to potentially copy them as a child operation of a coin operation
  for (const tokenOperation of preparedTokenOperations) {
    const { token } = await decodeTokenAccountId(tokenOperation.accountId);
    if (!token) continue;

    let mainOperations = coinOperationsByHash[tokenOperation.hash];

    if (!mainOperations?.length) {
      const noneOperation = await makeCoinOperationForOrphanChildOperation(tokenOperation);
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

// filter out CONTRACT_CALL operations based on pending and already existing ERC20 operations to avoid duplicates
export const removeDuplicatedContractCallOperations = (
  operations: Operation[],
  pendingOperationHashes: Set<string>,
  erc20OperationHashes: Set<string>,
): Operation[] => {
  return operations.filter(op => {
    if (op.type !== "CONTRACT_CALL") {
      return true;
    }

    const hashAlreadyExists =
      erc20OperationHashes.has(op.hash) || pendingOperationHashes.has(op.hash);

    return !hashAlreadyExists;
  });
};

// loop over latestERC20Operations and prepare lists of transactions that should be patched and added
// - patching happens when we have a matching CONTRACT_CALL operation without blockHash set (mirror node transaction without ERC20 details)
// - adding happens when we have no matching operation
export const classifyERC20Operations = ({
  latestERC20Operations,
  operationsByHash,
  evmAccountAddress,
}: {
  latestERC20Operations: OperationERC20[];
  operationsByHash: Map<string, Operation>;
  evmAccountAddress: string | null;
}): {
  erc20OperationsToPatch: Map<string, OperationERC20>;
  erc20OperationsToAdd: Map<string, OperationERC20>;
} => {
  const erc20OperationsToPatch = new Map<string, OperationERC20>();
  const erc20OperationsToAdd = new Map<string, OperationERC20>();

  for (const erc20Operation of latestERC20Operations) {
    const hash = base64ToUrlSafeBase64(erc20Operation.mirrorTransaction.transaction_hash);
    const existingOp = operationsByHash.get(hash);
    const type =
      erc20Operation.thirdwebTransaction.decoded.params.from === evmAccountAddress ? "OUT" : "IN";

    if (!existingOp) {
      erc20OperationsToAdd.set(hash, erc20Operation);
      continue;
    }

    if (existingOp.type === "CONTRACT_CALL" && type === "OUT" && !existingOp.blockHash) {
      erc20OperationsToPatch.set(hash, erc20Operation);
      continue;
    }
  }

  return { erc20OperationsToPatch, erc20OperationsToAdd };
};

// extracts common fields from an ERC20 operation
export const buildERC20OperationFields = ({
  erc20Operation,
  relatedExistingOperation,
  variant,
  evmAddress,
}: {
  variant: "patch" | "add";
  evmAddress: string | null;
  erc20Operation: OperationERC20;
  relatedExistingOperation?: Operation;
}): ERC20OperationFields | null => {
  const decodedParams = parseThirdwebTransactionParams(erc20Operation.thirdwebTransaction);

  if (!decodedParams) {
    return null;
  }

  let type: OperationType = "OUT";
  const standard = "erc20" as const;
  const blockHeight = 5; // blockHeight is lower than account's blockHeight set in synchronisation.ts, so the operation won't get stuck as pending
  const blockHash = erc20Operation.thirdwebTransaction.blockHash;
  const consensusTimestamp = erc20Operation.mirrorTransaction.consensus_timestamp;
  const timestamp = new Date(Number.parseInt(consensusTimestamp.split(".")[0], 10) * 1000);
  const fee = BigNumber(erc20Operation.mirrorTransaction.charged_tx_fee);
  const value = BigNumber(decodedParams.value);
  const senderAddress = fromEVMAddress(decodedParams.from) ?? decodedParams.from;
  const recipientAddress = fromEVMAddress(decodedParams.to) ?? decodedParams.to;
  const memo = getMemoFromBase64(erc20Operation.mirrorTransaction.memo_base64);
  const extra: HederaOperationExtra = {
    ...(isValidExtra(relatedExistingOperation?.extra) && relatedExistingOperation.extra),
    ...(memo && { memo }),
    consensusTimestamp: erc20Operation.contractCallResult.timestamp,
    transactionId: erc20Operation.mirrorTransaction.transaction_id,
    gasConsumed: erc20Operation.contractCallResult.gas_consumed,
    gasLimit: erc20Operation.contractCallResult.gas_limit,
    gasUsed: erc20Operation.contractCallResult.gas_used,
  };

  if (variant === "add") {
    type = decodedParams.from === evmAddress ? "OUT" : "IN";
  }

  return {
    date: timestamp,
    type,
    fee,
    value,
    senders: [senderAddress],
    recipients: [recipientAddress],
    blockHeight,
    blockHash,
    extra,
    standard,
    hasFailed: false,
  };
};

// patches an existing CONTRACT_CALL operation with ERC20 token operation details
export const patchContractCallOperation = ({
  relatedExistingOperation,
  ledgerAccountId,
  hash,
  erc20Fields,
  tokenOperation,
}: {
  relatedExistingOperation: Operation;
  ledgerAccountId: string;
  hash: string;
  erc20Fields: ERC20OperationFields;
  tokenOperation: Operation;
}): void => {
  Object.assign(relatedExistingOperation, {
    ...erc20Fields,
    id: encodeOperationId(ledgerAccountId, hash, "FEES"),
    type: "FEES",
    value: erc20Fields.fee,
    subOperations: [tokenOperation],
  });
};

export const integrateERC20Operations = async ({
  ledgerAccountId,
  address,
  allOperations,
  latestERC20Operations,
  pendingOperationHashes,
  erc20OperationHashes,
}: {
  ledgerAccountId: string;
  address: string;
  allOperations: Operation[];
  latestERC20Operations: OperationERC20[];
  pendingOperationHashes: Set<string>;
  erc20OperationHashes: Set<string>;
}): Promise<{
  updatedOperations: Operation[];
  newERC20TokenOperations: Operation[];
}> => {
  const newERC20TokenOperations: Operation[] = [];
  const evmAddress = await toEVMAddress(address);

  // avoid duplicated CONTRACT_CALL operations if ERC20 operations are already present
  const uniqueOperations = removeDuplicatedContractCallOperations(
    allOperations,
    pendingOperationHashes,
    erc20OperationHashes,
  );

  // nothing to patch/add if no new ERC20 operations found
  if (latestERC20Operations.length === 0) {
    return {
      updatedOperations: uniqueOperations,
      newERC20TokenOperations,
    };
  }

  // create copy to avoid mutating original array and index by hash for easy lookup
  const updatedOperations = uniqueOperations.map(op => ({ ...op }));
  const operationsByHash = updatedOperations.reduce((acc, curr) => {
    acc.set(curr.hash, curr);
    return acc;
  }, new Map<string, Operation>());

  // split erc20 operations into patch and add lists
  const { erc20OperationsToPatch, erc20OperationsToAdd } = classifyERC20Operations({
    latestERC20Operations,
    operationsByHash,
    evmAccountAddress: evmAddress,
  });

  // patch existing operations with data from thirdweb
  for (const [hash, erc20Operation] of erc20OperationsToPatch.entries()) {
    const relatedExistingOperation = operationsByHash.get(hash);
    if (!relatedExistingOperation) continue;

    const erc20Fields = buildERC20OperationFields({
      variant: "patch",
      evmAddress,
      erc20Operation,
      relatedExistingOperation,
    });
    if (!erc20Fields) continue;

    const encodedTokenAccountId = encodeTokenAccountId(ledgerAccountId, erc20Operation.token);
    const encodedOperationId = encodeOperationId(encodedTokenAccountId, hash, erc20Fields.type);
    const tokenOperation: Operation<HederaOperationExtra> = {
      ...erc20Fields,
      id: encodedOperationId,
      accountId: encodedTokenAccountId,
      hash,
    };

    patchContractCallOperation({
      relatedExistingOperation,
      ledgerAccountId,
      hash,
      erc20Fields,
      tokenOperation,
    });

    newERC20TokenOperations.push(tokenOperation);
  }

  // create new operations for remaining ERC20 operations
  for (const [hash, erc20Operation] of erc20OperationsToAdd.entries()) {
    const erc20Fields = buildERC20OperationFields({
      variant: "add",
      evmAddress,
      erc20Operation,
    });
    if (!erc20Fields) continue;

    const encodedTokenAccountId = encodeTokenAccountId(ledgerAccountId, erc20Operation.token);
    const encodedOperationId = encodeOperationId(encodedTokenAccountId, hash, erc20Fields.type);
    const tokenOperation: Operation<HederaOperationExtra> = {
      ...erc20Fields,
      id: encodedOperationId,
      accountId: encodedTokenAccountId,
      hash,
    };

    const coinOperation: Operation<HederaOperationExtra> =
      erc20Fields.type === "OUT"
        ? {
            ...erc20Fields,
            id: encodeOperationId(ledgerAccountId, hash, "FEES"),
            accountId: ledgerAccountId,
            type: "FEES",
            value: erc20Fields.fee,
            hash,
          }
        : await makeCoinOperationForOrphanChildOperation(tokenOperation);

    coinOperation.subOperations = [tokenOperation];
    updatedOperations.push(coinOperation);
    newERC20TokenOperations.push(tokenOperation);
  }

  // ensure operations lists are sorted correctly
  updatedOperations.sort((a, b) => b.date.getTime() - a.date.getTime());
  newERC20TokenOperations.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    updatedOperations,
    newERC20TokenOperations,
  };
};
