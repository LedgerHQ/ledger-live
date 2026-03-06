import { getSyncHash as baseGetSyncHash } from "@ledgerhq/coin-framework/account/index";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { isNFTActive } from "@ledgerhq/coin-framework/nft/support";
import { getEIP712FieldsDisplayedOnNano } from "@ledgerhq/evm-tools/message/EIP712/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency, Unit } from "@ledgerhq/types-cryptoassets";
import { Account, AnyMessage, MessageProperties, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import murmurhash from "imurmurhash";
import { getCoinConfig } from "./config";
import { getNodeApi } from "./network/node/index";

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
  transaction: string,
): Promise<BigNumber | undefined> => {
  switch (currency.id) {
    case "optimism":
    case "optimism_sepolia":
    case "blast":
    case "blast_sepolia":
    case "base":
    case "base_sepolia": {
      const nodeApi = getNodeApi(currency);
      const additionalFees = await nodeApi.getOptimismAdditionalFees(currency, transaction);
      return additionalFees;
    }
    case "scroll":
    case "scroll_sepolia": {
      const nodeApi = getNodeApi(currency);
      const additionalFees = await nodeApi.getScrollAdditionalFees(currency, transaction);
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
  { name: "operations", isOps: true },
  { name: "pendingOperations", isOps: true },
];

/**
 * NOTE Still imported by `coin-celo`
 *
 * In charge of smartly merging sub accounts while maintaining references as much as possible
 */
export const mergeSubAccounts = (
  initialAccount: Account | undefined,
  newSubAccounts: Partial<TokenAccount>[],
): Array<Partial<TokenAccount> | TokenAccount> => {
  const oldSubAccounts: Array<Partial<TokenAccount> | TokenAccount> | undefined =
    initialAccount?.subAccounts;
  if (!oldSubAccounts) {
    return newSubAccounts;
  }

  // Creating a map of already existing sub accounts by id
  const oldSubAccountsById: { [key: string]: Partial<TokenAccount> } = {};
  for (const oldSubAccount of oldSubAccounts) {
    oldSubAccountsById[oldSubAccount.id!] = oldSubAccount;
  }

  // Looping on new sub accounts to compare them with already existing ones
  // Already existing will be updated if necessary (see `updatableSubAccountProperties`)
  // Fresh new sub accounts will be added/pushed after already existing
  const newSubAccountsToAdd: Partial<TokenAccount>[] = [];
  for (const newSubAccount of newSubAccounts) {
    const duplicatedAccount: Partial<TokenAccount> | undefined =
      oldSubAccountsById[newSubAccount.id!];

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
 * NOTE Still imported by `coin-celo`
 *
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
 */
export const getSyncHash = async (
  currency: CryptoCurrency,
  blacklistedTokenIds: string[] = [],
): Promise<string> => {
  const syncHash = await baseGetSyncHash(currency.id, blacklistedTokenIds);
  const isNftSupported = isNFTActive(currency);

  const config = getCoinConfig(currency).info;
  const { node = {}, explorer = {} } = config;

  const stringToHash = syncHash + isNftSupported + JSON.stringify(node) + JSON.stringify(explorer);
  return `0x${murmurhash(stringToHash).result().toString(16)}`;
};

/**
 * Helper to get the message properties to be displayed on the Nano
 */
export const getMessageProperties = async (
  messageData: AnyMessage,
): Promise<MessageProperties | null> => {
  if (messageData.standard === "EIP712") {
    return getEIP712FieldsDisplayedOnNano(messageData.message, getEnv("CAL_SERVICE_URL"));
  }

  return null;
};

/**
 * NOTE Still imported by `coin-celo`
 *
 * Similar to mergeAccount but used to keep previous data we can't fetch on chain
 */
export const createSwapHistoryMap = (
  initialAccount: Account | undefined,
): Map<string, TokenAccount["swapHistory"]> => {
  if (!initialAccount?.subAccounts) return new Map();

  const swapHistoryMap = new Map<string, TokenAccount["swapHistory"]>();
  for (const subAccount of initialAccount.subAccounts) {
    swapHistoryMap.set(subAccount.token.id, subAccount.swapHistory);
  }

  return swapHistoryMap;
};
