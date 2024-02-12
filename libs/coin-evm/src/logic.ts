import eip55 from "eip55";
import BigNumber from "bignumber.js";
import {
  Account,
  AnyMessage,
  MessageProperties,
  Operation,
  SubAccount,
} from "@ledgerhq/types-live";
import murmurhash from "imurmurhash";
import { getEnv } from "@ledgerhq/live-env";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets/tokens";
import { decodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { log } from "@ledgerhq/logs";
import { getNodeApi } from "./api/node/index";
import {
  EvmNftTransaction,
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "./types";

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const legacyTransactionHasFees = (tx: EvmTransactionLegacy): boolean =>
  Boolean((!tx.type || tx.type < 2) && tx.gasPrice);

/**
 * Helper to check if a legacy transaction has the right fee property
 */
export const eip1559TransactionHasFees = (tx: EvmTransactionEIP1559): boolean =>
  Boolean(tx.type === 2 && tx.maxFeePerGas && tx.maxPriorityFeePerGas);

/**
 * Helper to get the gas limit value for a tx, depending on if the user has set a custom value or not
 */
export const getGasLimit = (tx: EvmTransaction): BigNumber => tx.customGasLimit ?? tx.gasLimit;

/**
 * Helper to get total fee value for a tx depending on its type
 */
export const getEstimatedFees = (tx: EvmTransaction): BigNumber => {
  const gasLimit = getGasLimit(tx);

  if (tx.type !== 2) {
    return tx.gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);
  }
  return tx.maxFeePerGas?.multipliedBy(gasLimit) || new BigNumber(0);
};

/**
 * Helper to get the currency unit to be used for the fee field
 */
export const getDefaultFeeUnit = (currency: CryptoCurrency): Unit =>
  currency.units.length > 1 ? currency.units[1] : currency.units[0];

/**
 * Helper returning the potential additional fees necessary for layer twos
 * to settle the transaction on layer 1.
 */
export const getAdditionalLayer2Fees = async (
  currency: CryptoCurrency,
  transaction: EvmTransaction,
): Promise<BigNumber | undefined> => {
  switch (currency.id) {
    case "optimism":
    case "optimism_goerli":
    case "base":
    case "base_goerli": {
      const nodeApi = getNodeApi(currency);
      const additionalFees = await nodeApi.getOptimismAdditionalFees(currency, transaction);
      return additionalFees;
    }
    default:
      return;
  }
};

/**
 * List of properties of a sub account that can be updated when 2 "identical" accounts are found
 */
const updatableSubAccountProperties: { name: string; isOps: boolean }[] = [
  { name: "balance", isOps: false },
  { name: "spendableBalance", isOps: false },
  { name: "balanceHistoryCache", isOps: false },
  { name: "swapHistory", isOps: false },
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
];

/**
 * In charge of smartly merging sub accounts while maintaining references as much as possible
 */
export const mergeSubAccounts = (
  initialAccount: Account | undefined,
  newSubAccounts: Partial<SubAccount>[],
): Array<Partial<SubAccount> | SubAccount> => {
  const oldSubAccounts: Array<Partial<SubAccount> | SubAccount> | undefined =
    initialAccount?.subAccounts;
  if (!oldSubAccounts) {
    return newSubAccounts;
  }

  // Creating a map of already existing sub accounts by id
  const oldSubAccountsById: { [key: string]: Partial<SubAccount> } = {};
  for (const oldSubAccount of oldSubAccounts) {
    oldSubAccountsById[oldSubAccount.id!] = oldSubAccount;
  }

  // Looping on new sub accounts to compare them with already existing ones
  // Already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // Fresh new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: Partial<SubAccount>[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: Partial<SubAccount> | undefined =
      oldSubAccountsById[newSubAccount.id!];

    // If this sub account was not already in the initialAccount
    if (!duplicatedAccount) {
      // We'll add it later
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    const updates: Partial<SubAccount> = {};
    for (const { name, isOps } of updatableSubAccountProperties) {
      if (!isOps) {
        // @ts-expect-error FIXME: fix typings
        if (newSubAccount[name] !== duplicatedAccount[name]) {
          // @ts-expect-error FIXME: fix typings
          updates[name] = newSubAccount[name];
        }
      } else {
        // @ts-expect-error FIXME: fix typings
        updates[name] = mergeOps(duplicatedAccount[name], newSubAccount[name]);
      }
    }
    // Updating the operationsCount in case the mergeOps changed it
    updates.operationsCount =
      updates.operations?.length || duplicatedAccount?.operations?.length || 0;

    // Modifying the Map with the updated sub account with a new ref
    oldSubAccountsById[newSubAccount.id!] = {
      ...duplicatedAccount,
      ...updates,
    };
  }
  const updatedSubAccounts = Object.values(oldSubAccountsById);
  return [...updatedSubAccounts, ...newSubAccountsToAdd];
};

/**
 * A pseudo private Map used to memoize the very long
 * string used to detect a change in the CAL
 * tokens and its corresponding hash.
 */
const simpleSyncHashMemoize: Record<string, string> = {};

/**
 * Helper clearing the simpleSyncHashMemoize object
 * Exported & used only by test runners
 */
export const __testOnlyClearSyncHashMemoize = (): void => {
  for (const key in simpleSyncHashMemoize) {
    delete simpleSyncHashMemoize[key];
  }
};

/**
 * Method creating a hash that will help triggering or not a full synchronization on an account.
 * As of now, it's checking if a token has been added, removed of changed regarding important properties
 * and if the NFTs are activated/supported on this chain
 *
 * The hashing algorithm selected to create this hash is murmurhash.
 * It's a fast non cryptographic algorithm with low collisions.
 * A collision here would only prevent a potential full sync
 * which would mean not seeing some potential new tokens.
 * This can be fixed by simply removing the account
 * and adding it again, now syncing from block 0.
 *
 * This computation could be easily simplified
 * if the CAL files where to include an
 * already crafted hash per token
 */
export const getSyncHash = (currency: CryptoCurrency): string => {
  const tokens = listTokensForCryptoCurrency(currency);
  const basicTokensListString = tokens
    .map(token => token.id + token.contractAddress + token.name + token.ticker)
    .join("");
  const isNftSupported = isNFTActive(currency);
  const { node = {}, explorer = {} } = currency.ethereumLikeInfo || {};
  // Did the migration of token accounts IDs
  // e.g. binance-peg_bsc-usd to binance#!dash!#peg#!underscore!#bsc#!dash!#usd
  //
  // This could theorically be removed after a decent amount of releases (~3/4),
  // just the time necessary for every user to have a different
  // hash at least once to avoid duplicated TokenAccounts.
  // For a user with duplicates, a "clear cache"
  // shoud be enough to fix everything.
  const hasSafeTokenIdAccount = true;

  const stringToHash =
    basicTokensListString +
    isNftSupported +
    JSON.stringify(node) +
    JSON.stringify(explorer) +
    hasSafeTokenIdAccount;

  if (!simpleSyncHashMemoize[stringToHash]) {
    simpleSyncHashMemoize[stringToHash] = `0x${murmurhash(stringToHash).result().toString(16)}`;
  }
  return simpleSyncHashMemoize[stringToHash];
};

/**
 * Helper in charge of linking operations together based on transaction hash.
 * Token operations & NFT operations are the result of a coin operation
 * and if this coin operation is originated by our user we want
 * to link those operations together as main & children ops.
 *
 * A sub operation should always be linked to a coin operation,
 * even if the user isn't at the origin of the sub op.
 * "NONE" coin ops can be added when necessary.
 *
 * ⚠️ If an NFT operation was found without a coin parent op
 * just like if it was not initiated by the synced account
 * and we were to find that coin op during another sync,
 * the NONE operation created would not be removed,
 * creating a duplicate that will cause issues.
 * (Incorrect NFT balance & React key dup)
 */
export const attachOperations = (
  _coinOperations: Operation[],
  _tokenOperations: Operation[],
  _nftOperations: Operation[],
  _internalOperations: Operation[],
): Operation[] => {
  // Creating deep copies of each Operation[] to prevent mutating the originals
  const coinOperations = _coinOperations.map(op => ({ ...op }));
  const tokenOperations = _tokenOperations.map(op => ({ ...op }));
  const nftOperations = _nftOperations.map(op => ({ ...op }));
  const internalOperations = _internalOperations.map(op => ({ ...op }));

  type OperationWithRequiredChildren = Operation &
    Required<Pick<Operation, "nftOperations" | "subOperations" | "internalOperations">>;

  // Helper to create a coin operation with type NONE as a parent of an orphan child operation
  const makeCoinOpForOrphanChildOp = (childOp: Operation): OperationWithRequiredChildren => {
    const type = "NONE";
    const { accountId } = decodeTokenAccountId(childOp.accountId);
    const id = encodeOperationId(accountId, childOp.hash, type);

    return {
      id,
      hash: childOp.hash,
      type,
      value: new BigNumber(0),
      fee: new BigNumber(0),
      senders: [],
      recipients: [],
      blockHeight: childOp.blockHeight,
      blockHash: childOp.blockHash,
      transactionSequenceNumber: childOp.transactionSequenceNumber,
      subOperations: [],
      nftOperations: [],
      internalOperations: [],
      accountId: "",
      date: childOp.date,
      extra: {},
    };
  };

  // Create a Map of hash => operation
  const coinOperationsByHash: Record<string, OperationWithRequiredChildren[]> = {};
  coinOperations.forEach(op => {
    if (!coinOperationsByHash[op.hash]) {
      coinOperationsByHash[op.hash] = [];
    }

    // Adding arrays just in case but this is defined
    // by the adapters so it should never be needed
    op.subOperations = [];
    op.nftOperations = [];
    op.internalOperations = [];
    coinOperationsByHash[op.hash].push(op as OperationWithRequiredChildren);
  });

  // Looping through token operations to potentially copy them as a child operation of a coin operation
  for (const tokenOperation of tokenOperations) {
    let mainOperations = coinOperationsByHash[tokenOperation.hash];
    if (!mainOperations?.length) {
      const noneOperation = makeCoinOpForOrphanChildOp(tokenOperation);
      mainOperations = [noneOperation];
      coinOperations.push(noneOperation);
    }

    // Ugly loop in loop but in theory, this can only be a 2 elements array maximum in the case of a self send
    for (const mainOperation of mainOperations) {
      mainOperation.subOperations.push(tokenOperation);
    }
  }

  // Looping through nft operations to potentially copy them as a child operation of a coin operation
  for (const nftOperation of nftOperations) {
    let mainOperations = coinOperationsByHash[nftOperation.hash];
    if (!mainOperations?.length) {
      const noneOperation = makeCoinOpForOrphanChildOp(nftOperation);
      mainOperations = [noneOperation];
      coinOperations.push(noneOperation);
    }

    // Ugly loop in loop but in theory, this can only be a 2 elements array maximum in the case of a self send
    for (const mainOperation of mainOperations) {
      mainOperation.nftOperations.push(nftOperation);
    }
  }

  // Looping through internal operations to potentially copy them as a child operation of a coin operation
  for (const internalOperation of internalOperations) {
    let mainOperations = coinOperationsByHash[internalOperation.hash];
    if (!mainOperations?.length) {
      const noneOperation = makeCoinOpForOrphanChildOp(internalOperation);
      mainOperations = [noneOperation];
      coinOperations.push(noneOperation);
    }

    // Ugly loop in loop but in theory, this can only be a 2 elements array maximum in the case of a self send
    for (const mainOperation of mainOperations) {
      mainOperation.internalOperations.push(internalOperation);
    }
  }

  return coinOperations;
};

/**
 * Type guard for NFT transactions
 */
export const isNftTransaction = (
  transaction: EvmTransaction,
): transaction is EvmTransaction & EvmNftTransaction =>
  ["erc1155", "erc721"].includes(transaction.mode);

/**
 * Helper adding when necessary a 0
 * prefix if string length is odd
 */
export const padHexString = (str: string): string => {
  return str.length % 2 !== 0 ? "0" + str : str;
};

/**
 * Helper to get the message properties to be displayed on the Nano
 */
export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("DYNAMIC_CAL_BASE_URL"));
  }

  return null;
};

/**
 * Some addresses returned by the explorers are not 40 characters hex addresses
 * For example the explorers may return "0x0" as an address (for example for
 * some events or contract interactions, like a contract creation transaction)
 *
 * This is not a valid EIP55 address and thus will fail when trying to encode it
 * with a "Bad address" error.
 * cf:
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L5-L6
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L63-L65
 *
 * Since we can't control what the explorer returns, and we don't want the app to crash
 * in these cases, we simply ignore the address and return an empty string.
 *
 * For now this has only been observed on the from or to fields of an operation
 * so we only use this function for these fields.
 */
export const safeEncodeEIP55 = (addr: string): string => {
  if (!addr || addr === "0x" || addr === "0x0") {
    return "";
  }

  try {
    return eip55.encode(addr);
  } catch (e) {
    log("EVM Family - logic.ts", "Failed to eip55 encode address", {
      address: addr,
      error: e,
    });

    return addr;
  }
};
