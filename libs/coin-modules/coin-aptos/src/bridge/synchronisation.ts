import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AptosAPI } from "../api";
import { txsToOps } from "./logic";
import type { AptosAccount } from "../types";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { decodeOperationId } from "@ledgerhq/coin-framework/operation";
import {
  decodeTokenAccountId,
  emptyHistoryCache,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";

/**
 * List of properties of a sub account that can be updated when 2 "identical" accounts are found
 */
const updatableSubAccountProperties: { name: string; isOps: boolean }[] = [
  { name: "balance", isOps: false },
  { name: "spendableBalance", isOps: false },
  { name: "balanceHistoryCache", isOps: false },
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
];
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

  // Creating a map of already existing sub accounts by id
  const oldSubAccountsById: { [key: string]: TokenAccount } = {};
  for (const oldSubAccount of oldSubAccounts) {
    oldSubAccountsById[oldSubAccount.id!] = oldSubAccount;
  }

  // Looping on new sub accounts to compare them with already existing ones
  // Already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // Fresh new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: TokenAccount[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: TokenAccount | undefined = oldSubAccountsById[newSubAccount.id!];

    // If this sub account was not already in the initialAccount
    if (!duplicatedAccount) {
      // We'll add it later
      newSubAccountsToAdd.push(newSubAccount);
      continue;
    }

    const updates: Partial<TokenAccount> = {};
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
 * Fetch the balance for a token and creates a TokenAccount based on this and the provided operations
 */
export const getSubAccountShape = async (
  currency: CryptoCurrency,
  address: string, // TODO: this should be redundant
  parentId: string,
  token: TokenCurrency,
  operations: Operation[],
): Promise<TokenAccount> => {
  const aptosClient = new AptosAPI(currency.id);
  //const { xpubOrAddress: address } = decodeAccountId(parentId); // TODO
  const tokenAccountId = encodeTokenAccountId(parentId, token); // TODO

  let balance = new BigNumber(0);
  if (token.tokenType == "coin") {
    balance = await aptosClient.getBalance(address, token.contractAddress);
  } else {
    balance = await aptosClient.getFABalance(address, token.contractAddress);
  }
  return {
    type: "TokenAccount",
    id: tokenAccountId,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operations,
    operationsCount: operations.length,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
};

/**
 * Getting all token related operations in order to provide TokenAccounts
 */
export const getSubAccounts = async (
  infos: AccountShapeInfo<Account>,
  address: string, //TODO: this should be redundant
  accountId: string,
  lastTokenOperations: Operation[],
  //blacklistedTokenIds: string[] = [],
  //swapHistoryMap: Map<TokenCurrency, TokenAccount["swapHistory"]>,
): Promise<TokenAccount[]> => {
  const { currency } = infos;

  // Creating a Map of Operations by TokenCurrencies in order to know which TokenAccounts should be synced as well
  const operationsByToken = lastTokenOperations.reduce<Map<TokenCurrency, Operation[]>>(
    (acc, operation) => {
      const { accountId } = decodeOperationId(operation.id);
      const { token } = decodeTokenAccountId(accountId);
      if (!token) return acc; // || blacklistedTokenIds.includes(token.id)

      if (!acc.has(token)) {
        acc.set(token, []);
      }
      acc.get(token)?.push(operation);
      return acc;
    },
    new Map<TokenCurrency, Operation[]>(),
  );

  // Fetching all TokenAccounts possible and providing already filtered operations
  const subAccountsPromises: Promise<TokenAccount>[] = [];
  for (const [token, ops] of operationsByToken.entries()) {
    subAccountsPromises.push(getSubAccountShape(currency, address, accountId, token, ops));
  }

  return Promise.all(subAccountsPromises);
};

// export const getSyncHash = (
//   currency: CryptoCurrency,
//   blacklistedTokenIds: string[] = [],
// ): string => {

//   const config = getCoinConfig(currency).info;
//   const { node = {}, explorer = {} } = config;

//   const stringToHash =
//     getCALHash(currency) +
//     blacklistedTokenIds.join("") +
//     isNftSupported +
//     JSON.stringify(node) +
//     JSON.stringify(explorer);>

//   return `0x${murmurhash(stringToHash).result().toString(16)}`;
// };

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode, rest } = info;

  const publicKey =
    rest?.publicKey || (initialAccount && decodeAccountId(initialAccount.id).xpubOrAddress);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey || address,
    derivationMode,
  });

  // "xpub" field is used to store publicKey to simulate transaction during sending tokens.
  // We can't get access to the Nano X via bluetooth on the step of simulation
  // but we need public key to simulate transaction.
  // "xpub" field is used because this field exists in ledger operation type
  const xpub = initialAccount?.xpub || publicKey || "";

  const oldOperations = initialAccount?.operations || [];
  const startAt = (oldOperations[0]?.extra as any)?.version;

  const aptosClient = new AptosAPI(currency.id);
  // get resources
  const { balance, transactions, blockHeight } = await aptosClient.getAccountInfo(address, startAt);

  const [newOperations, tokenOperations]: [Operation[], Operation[]] = txsToOps(
    info,
    accountId,
    transactions,
  );
  const operations = mergeOps(oldOperations, newOperations);

  const newSubAccounts = await getSubAccounts(info, address, accountId, tokenOperations);

  // const lastTokenOperations: Operation[] = [];
  // for (const tokenOperation of tokenOperations) {
  //   const newSubAccounts = await getSubAccounts(info, accountId, lastTokenOperations);
  // }

  //const syncHash = getSyncHash(currency, blacklistedTokenIds);
  const shouldSyncFromScratch = initialAccount === undefined;

  const subAccounts = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts); // Merging potential new subAccouns while preserving the references

  // const subAccounts = newSubAccounts;

  const shape: Partial<AptosAccount> = {
    type: "Account",
    id: accountId,
    xpub,
    balance: balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
    subAccounts,
  };

  return shape;
};
