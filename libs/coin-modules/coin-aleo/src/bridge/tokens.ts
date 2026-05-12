import BigNumber from "bignumber.js";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import type { AleoVerifiedToken } from "../types/api";
import type { AleoOperation } from "../types/bridge";
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

function ensureTokenIdFieldSuffix(tokenId: string): string {
  return tokenId.endsWith("field") ? tokenId : `${tokenId}field`;
}

async function computeTokenBalanceKey(tokenId: string, ownerAddress: string): Promise<string> {
  const { BHP256, Plaintext } = await import("@provablehq/sdk/mainnet.js");

  const hasher = new BHP256();
  const normalizedTokenId = ensureTokenIdFieldSuffix(tokenId);
  const structPlaintext = Plaintext.fromString(
    `{ account: ${ownerAddress}, token_id: ${normalizedTokenId} }`,
  );
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

type DiscoveredToken = {
  tokenCurrency: TokenCurrency;
  verifiedToken: AleoVerifiedToken;
};

function discoverTokensFromOperations(
  tokenOperations: AleoOperation[],
  verifiedTokens: AleoVerifiedToken[],
  currency: CryptoCurrency,
): DiscoveredToken[] {
  // FIXME: MOCKED CAL LIST BASED ON VERIFIED TOKENS LIST
  const mockedCAL = verifiedTokens.filter(t => t.program_name !== PROGRAM_ID.CREDITS);
  const registryTokensMap = new Map<string, AleoVerifiedToken>(
    mockedCAL.filter(isRegistryToken).map(t => [normalizeTokenId(t.token_id), t]),
  );
  const customProgramTokensMap = new Map<string, AleoVerifiedToken>(
    mockedCAL.filter(isCustomProgramToken).map(t => [t.program_name, t]),
  );

  const seen = new Set<string>();
  const discovered: DiscoveredToken[] = [];

  for (const op of tokenOperations) {
    const tokenInfo = op.extra?.tokenInfo;
    if (!tokenInfo) continue; // null = native, undefined = legacy

    let verifiedToken: AleoVerifiedToken | undefined;
    if (tokenInfo.programId === PROGRAM_ID.TOKEN_REGISTRY) {
      if (tokenInfo.tokenId && tokenInfo.tokenId !== "0") {
        verifiedToken = registryTokensMap.get(normalizeTokenId(tokenInfo.tokenId));
      }
    } else {
      verifiedToken = customProgramTokensMap.get(tokenInfo.programId);
    }

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
      return parseTokenBalance(await apiClient.getRegistryTokenBalance(currency, mappingKey));
    }
    case "program": {
      return parseTokenBalance(
        await apiClient.getProgramTokenBalance(currency, strategy.programId, address),
      );
    }
  }
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
