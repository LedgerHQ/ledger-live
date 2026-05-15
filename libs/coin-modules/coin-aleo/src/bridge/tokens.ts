import BigNumber from "bignumber.js";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { AleoVerifiedToken } from "../types/api";
import type { AleoOperation, AleoOperationExtra } from "../types/bridge";
import { apiClient } from "../network/api";
import { PROGRAM_ID } from "../constants";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";

/**
 * Strips the trailing `field` type suffix that Aleo appends to token IDs
 * (e.g. `"...049field"` → `"...049"`). Used to normalise IDs before comparison
 * so that a mismatch in suffix presence never causes a lookup miss.
 */
function normalizeTokenId(tokenId: string): string {
  return tokenId.endsWith("field") ? tokenId.slice(0, -"field".length).trimEnd() : tokenId;
}

async function computeTokenBalanceKey(tokenId: string, ownerAddress: string): Promise<string> {
  const { BHP256, Plaintext } = await import("@provablehq/sdk/mainnet.js");

  const hasher = new BHP256();
  const fieldTokenId = tokenId.endsWith("field") ? tokenId : `${tokenId}field`;
  const hashPlaintext = `{ account: ${ownerAddress}, token_id: ${fieldTokenId} }`;
  const structPlaintext = Plaintext.fromString(hashPlaintext);
  const bits = structPlaintext.toBitsLe();

  return hasher.hash(bits).toString();
}

/** Registry tokens are those managed by the token_registry.aleo program. */
function isRegistryToken(token: AleoVerifiedToken): boolean {
  return token.program_name === PROGRAM_ID.TOKEN_REGISTRY;
}

/** Custom-program tokens use their own program (not token_registry.aleo). */
function isCustomProgramToken(token: AleoVerifiedToken): boolean {
  return token.program_name !== PROGRAM_ID.TOKEN_REGISTRY;
}

interface VerifiedTokenMaps {
  registryTokensMap: Map<string, AleoVerifiedToken>;
  customProgramTokensMap: Map<string, AleoVerifiedToken>;
}

function buildVerifiedTokenMaps(verifiedTokens: AleoVerifiedToken[]): VerifiedTokenMaps {
  const relevant = verifiedTokens.filter(t => t.program_name !== PROGRAM_ID.CREDITS);
  return {
    registryTokensMap: new Map(
      relevant.filter(isRegistryToken).map(t => [normalizeTokenId(t.token_id), t]),
    ),
    customProgramTokensMap: new Map(
      relevant.filter(isCustomProgramToken).map(t => [t.program_name, t]),
    ),
  };
}

function resolveVerifiedToken(
  tokenInfo: { programId: string; tokenId: string | null },
  { registryTokensMap, customProgramTokensMap }: VerifiedTokenMaps,
): AleoVerifiedToken | undefined {
  if (tokenInfo.programId === PROGRAM_ID.TOKEN_REGISTRY) {
    if (tokenInfo.tokenId && tokenInfo.tokenId !== "0") {
      return registryTokensMap.get(normalizeTokenId(tokenInfo.tokenId));
    }
    return undefined;
  }
  return customProgramTokensMap.get(tokenInfo.programId);
}

function buildTokenCurrencyFromVerifiedToken(
  parentCurrency: CryptoCurrency,
  token: AleoVerifiedToken,
): TokenCurrency {
  const contractAddress = isRegistryToken(token) ? token.token_id : token.program_name;
  // Stable id: strip trailing "field" suffix for registry token ids.
  const idKey = isRegistryToken(token) ? normalizeTokenId(contractAddress) : contractAddress;

  return {
    type: "TokenCurrency",
    id: `aleo/aleo_token/${idKey}`,
    contractAddress,
    parentCurrency,
    tokenType: "aleo_token",
    name: token.display,
    ticker: token.symbol,
    units: [
      {
        name: token.display,
        code: token.symbol,
        magnitude: token.decimals,
        showAllDigits: false,
        prefixCode: false,
      },
    ],
  };
}

type BalanceStrategy =
  | { type: "registry"; tokenId: string }
  | { type: "program"; programId: string };

function getBalanceStrategy(token: AleoVerifiedToken): BalanceStrategy {
  if (isRegistryToken(token)) {
    return { type: "registry", tokenId: token.token_id };
  }

  return { type: "program", programId: token.program_name };
}

interface DiscoveredToken {
  tokenCurrency: TokenCurrency;
  verifiedToken: AleoVerifiedToken;
}

function discoverTokensFromOperations(
  tokenOperations: AleoOperation[],
  verifiedTokens: AleoVerifiedToken[],
  currency: CryptoCurrency,
): DiscoveredToken[] {
  // FIXME: MOCKED CAL LIST BASED ON VERIFIED TOKENS LIST
  const tokenMaps = buildVerifiedTokenMaps(verifiedTokens);
  const seen = new Set<string>();
  const discovered: DiscoveredToken[] = [];

  for (const op of tokenOperations) {
    const tokenInfo = op.extra?.tokenInfo;
    if (!tokenInfo) continue; // null = native, undefined = legacy

    const verifiedToken = resolveVerifiedToken(tokenInfo, tokenMaps);
    if (!verifiedToken) continue;

    const tokenCurrency = buildTokenCurrencyFromVerifiedToken(currency, verifiedToken);
    if (seen.has(tokenCurrency.id)) continue;

    seen.add(tokenCurrency.id);
    discovered.push({ tokenCurrency, verifiedToken });
  }

  return discovered;
}

async function fetchTokenBalance(
  token: DiscoveredToken,
  address: string,
  currency: CryptoCurrency,
): Promise<BigNumber> {
  const strategy = getBalanceStrategy(token.verifiedToken);

  switch (strategy.type) {
    case "registry": {
      const mappingKey = await computeTokenBalanceKey(strategy.tokenId, address);
      const balance = await apiClient.getRegistryTokenBalance(currency, mappingKey);
      return parseTokenBalance(balance);
    }
    case "program": {
      const balance = await apiClient.getProgramTokenBalance(currency, strategy.programId, address);
      return parseTokenBalance(balance);
    }
  }
}

/**
 * Parses Aleo token balance payloads into BigNumber.
 * Supports direct balances (e.g. "123u128") and token_registry structs
 * (e.g. "{ ..., balance: 2u128, authorized_until: ... }").
 * Returns zero if the input is null or cannot be parsed.
 */
function parseTokenBalance(balanceStr: string | null): BigNumber {
  if (!balanceStr) return new BigNumber(0);

  const directBalanceMatch = balanceStr.trim().match(/^(\d+)u\d+$/);
  if (directBalanceMatch) {
    return new BigNumber(directBalanceMatch[1]);
  }

  const structBalanceMatch = balanceStr.match(/\bbalance\s*:\s*(\d+)u\d+/);
  if (structBalanceMatch) {
    return new BigNumber(structBalanceMatch[1]);
  }

  return new BigNumber(0);
}

/**
 * Builds token sub-accounts from `tokenOperations` (operations already known to be token
 * transfers), matching against `verifiedTokens`. Each sub-account appears at most once
 * (deduplication across existing and new).
 */
function buildSubAccountsFromOperations({
  address,
  tokenOperations,
  verifiedTokens,
  ledgerAccountId,
  currency,
}: {
  address: string;
  tokenOperations: AleoOperation[];
  verifiedTokens: AleoVerifiedToken[];
  ledgerAccountId: string;
  currency: CryptoCurrency;
}): Promise<TokenAccount[]> {
  const discovered = discoverTokensFromOperations(tokenOperations, verifiedTokens, currency);

  return Promise.allSettled(
    discovered.map(async token => {
      const balance = await fetchTokenBalance(token, address, currency);
      const id = encodeTokenAccountId(ledgerAccountId, token.tokenCurrency);

      return buildTokenAccount(id, ledgerAccountId, token.tokenCurrency, balance);
    }),
  ).then(results =>
    results.flatMap(result => {
      if (result.status === "fulfilled") {
        return [result.value];
      }

      return [];
    }),
  );
}

export async function getAleoSubAccounts({
  currency,
  ledgerAccountId,
  address,
  tokenOperations,
}: {
  currency: CryptoCurrency;
  ledgerAccountId: string;
  address: string;
  tokenOperations: AleoOperation[];
}): Promise<TokenAccount[]> {
  if (tokenOperations.length === 0) return [];

  const allVerified = await apiClient.getVerifiedTokens({ currency });

  return buildSubAccountsFromOperations({
    address,
    tokenOperations,
    verifiedTokens: allVerified,
    ledgerAccountId,
    currency,
  });
}

type TokenAccountId = string;

type CoinOperationWithSubOps = AleoOperation & Required<Pick<AleoOperation, "subOperations">>;

/** Creates a NONE coin operation to act as a parent for an orphan token operation. */
function makeNoneParentForOrphanTokenOp(
  ledgerAccountId: string,
  tokenOp: AleoOperation,
): CoinOperationWithSubOps {
  const extra: AleoOperationExtra = {
    functionId: tokenOp.extra?.functionId ?? "",
    transactionType: tokenOp.extra?.transactionType ?? "public",
  };
  return {
    id: encodeOperationId(ledgerAccountId, tokenOp.hash, "NONE"),
    hash: tokenOp.hash,
    type: "NONE",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: tokenOp.blockHeight,
    blockHash: tokenOp.blockHash,
    accountId: ledgerAccountId,
    date: tokenOp.date,
    extra,
    subOperations: [],
    nftOperations: [],
    internalOperations: [],
    hasFailed: false,
  };
}

/**
 * Links raw token operations (as returned by listOperations, with `accountId = ledgerAccountId`)
 * to their parent coin operations via `subOperations`, and builds a per-sub-account
 * operation map ready to be merged into sub-accounts.
 *
 * For each token operation:
 *  - The correct `TokenCurrency` is resolved from `extra.tokenInfo`.
 *  - A new operation is created with `accountId = encodeTokenAccountId(…)` and
 *    an appropriate IN/OUT type derived from senders/recipients vs the account address.
 *  - The new operation is attached as a `subOperation` of the matching coin operation
 *    (matched by hash). If no coin operation matches, a NONE parent is inserted.
 *
 * @returns updatedCoinOperations – coin ops with `subOperations` filled in.
 * @returns tokenOperationsBySubAccountId – map from token account id to its operations.
 */
export async function prepareTokenOperations({
  currency,
  address,
  ledgerAccountId,
  coinOperations,
  tokenOperations,
}: {
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  coinOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
}): Promise<{
  updatedCoinOperations: AleoOperation[];
  tokenOperationsBySubAccountId: Map<TokenAccountId, AleoOperation[]>;
}> {
  const tokenOperationsBySubAccountId = new Map<TokenAccountId, AleoOperation[]>();

  if (tokenOperations.length === 0) {
    return {
      updatedCoinOperations: coinOperations,
      tokenOperationsBySubAccountId,
    };
  }

  const allVerified = await apiClient.getVerifiedTokens({ currency });
  const tokenMaps = buildVerifiedTokenMaps(allVerified);

  // shallow-copy coin operations so we can mutate subOperations without side effects
  const updatedCoinOperations: CoinOperationWithSubOps[] = coinOperations.map(op => ({
    ...op,
    subOperations: op.subOperations ? [...op.subOperations] : [],
  }));

  const coinOpsByHash = new Map<string, CoinOperationWithSubOps>(
    updatedCoinOperations.map(op => [op.hash, op]),
  );

  for (const tokenOp of tokenOperations) {
    const tokenInfo = tokenOp.extra?.tokenInfo;
    if (!tokenInfo) continue;

    const verifiedToken = resolveVerifiedToken(tokenInfo, tokenMaps);
    if (!verifiedToken) continue;

    const tokenCurrency = buildTokenCurrencyFromVerifiedToken(currency, verifiedToken);
    const tokenAccountId = encodeTokenAccountId(ledgerAccountId, tokenCurrency);

    // Derive IN/OUT for the sub-account from the raw operation's senders/recipients.
    // The coin op has type NONE for token-program transactions; the sub-account needs
    // a meaningful direction.
    const type: OperationType = tokenOp.recipients.includes(address) ? "IN" : "OUT";

    const subAccountOp: AleoOperation = {
      ...tokenOp,
      id: encodeOperationId(tokenAccountId, tokenOp.hash, type),
      accountId: tokenAccountId,
      type,
    };

    // Add a FEES coin operation for outgoing token transfers
    if (type === "OUT") {
      const feesOp: AleoOperation = {
        ...tokenOp,
        id: encodeOperationId(ledgerAccountId, tokenOp.hash, "FEES"),
        accountId: ledgerAccountId,
        type: "FEES",
        value: tokenOp.fee,
      };
      updatedCoinOperations.push({ ...feesOp, subOperations: [subAccountOp] });
    }

    // attach to parent coin operation, creating a NONE parent if none exists
    let parentCoinOp = coinOpsByHash.get(tokenOp.hash);
    if (!parentCoinOp) {
      parentCoinOp = makeNoneParentForOrphanTokenOp(ledgerAccountId, tokenOp);
      updatedCoinOperations.push(parentCoinOp);
      coinOpsByHash.set(tokenOp.hash, parentCoinOp);
    }
    parentCoinOp.subOperations = [...(parentCoinOp.subOperations ?? []), subAccountOp];

    const existing = tokenOperationsBySubAccountId.get(tokenAccountId) ?? [];
    tokenOperationsBySubAccountId.set(tokenAccountId, [...existing, subAccountOp]);
  }

  return { updatedCoinOperations, tokenOperationsBySubAccountId };
}

function buildTokenAccount(
  id: string,
  parentId: string,
  token: TokenCurrency,
  balance: BigNumber = new BigNumber(0),
): TokenAccount {
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    balance,
    spendableBalance: balance,
    creationDate: new Date(),
    operations: [],
    operationsCount: 0,
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}

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

/**
 * Prepares sub-accounts and the updated coin operations for a public sync cycle.
 *
 * Combines prepareTokenOperations, getAleoSubAccounts and mergeSubAccounts into
 * a single call so callers don't need a mutable variable to capture the updated
 * coin operations alongside the sub-accounts.
 *
 * @returns updatedCoinOperations – coin operations with subOperations attached.
 * @returns subAccounts – merged token sub-accounts ready to be stored on the account.
 */
export async function resolveTokenSubAccounts({
  enableTokens,
  currency,
  address,
  ledgerAccountId,
  coinOperations,
  tokenOperations,
  shouldSyncFromScratch,
  initialAccount,
}: {
  enableTokens: boolean;
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  coinOperations: AleoOperation[];
  tokenOperations: AleoOperation[];
  shouldSyncFromScratch: boolean;
  initialAccount: Account | undefined;
}): Promise<{ updatedCoinOperations: AleoOperation[]; subAccounts: TokenAccount[] }> {
  if (!enableTokens) {
    return { updatedCoinOperations: coinOperations, subAccounts: [] };
  }

  const { updatedCoinOperations, tokenOperationsBySubAccountId } = await prepareTokenOperations({
    currency,
    address,
    ledgerAccountId,
    coinOperations,
    tokenOperations,
  });

  const fetchedSubAccounts = await getAleoSubAccounts({
    currency,
    ledgerAccountId,
    address,
    tokenOperations,
  });

  const newSubAccounts = fetchedSubAccounts.map(subAccount => {
    const ops = tokenOperationsBySubAccountId.get(subAccount.id) ?? [];
    return { ...subAccount, operations: ops, operationsCount: ops.length };
  });

  const subAccounts = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts);

  return { updatedCoinOperations, subAccounts };
}
