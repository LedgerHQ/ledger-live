/**
 * React Router decodes URL parameters, but account IDs in the Redux store are encoded.
 * This function returns an array of IDs to try when searching for an account:
 * first the ID as-is (from URL), then the encoded version (as stored in the store).
 *
 * @param id - The account ID from URL parameters (may contain decoded slashes)
 * @returns Array of IDs to try: [id, encodedId] if id contains slashes, [id] otherwise
 */
function encodeTokenIdForAccountId(tokenId: string): string {
  if (!tokenId) return "";
  return encodeURIComponent(tokenId).replace(/-/g, "~!dash!~").replace(/_/g, "~!underscore!~");
}

function getAccountIdVariants(id: string): string[] {
  const variants = [id];
  if (id.includes("+")) {
    const [accountId, tokenId] = id.split("+");
    const encodedTokenId = encodeTokenIdForAccountId(tokenId);
    if (encodedTokenId && encodedTokenId !== tokenId) {
      variants.push(`${accountId}+${encodedTokenId}`);
    }
  }
  if (id.includes("/")) {
    const encodedSlashes = id.replace(/\//g, "%2F");
    if (encodedSlashes !== id) {
      variants.push(encodedSlashes);
    }
  }
  return variants;
}

/**
 * Finds an account in an array by ID, trying both the decoded and encoded versions.
 * React Router decodes URL parameters, but account IDs in the Redux store are encoded.
 *
 * @param accounts - Array of accounts to search in
 * @param id - The account ID from URL parameters (may contain decoded slashes)
 * @returns The found account, or undefined if not found
 */
export function findAccountById<T extends { id: string }>(
  accounts: T[],
  id: string,
): T | undefined {
  const variants = getAccountIdVariants(id);
  for (const variant of variants) {
    const found = accounts.find(a => a.id === variant);
    if (found) return found;
  }
  return undefined;
}

/**
 * Finds an item in an array by key, trying both the decoded and encoded versions.
 * React Router decodes URL parameters, but account IDs in the Redux store are encoded.
 * This is useful for items that use 'key' instead of 'id' (e.g., dropdown items).
 *
 * @param items - Array of items to search in
 * @param key - The key to search for (may contain decoded slashes)
 * @returns The found item, or undefined if not found
 */
export function findItemByKey<T extends { key: string }>(items: T[], key: string): T | undefined {
  const variants = getAccountIdVariants(key);
  for (const variant of variants) {
    const found = items.find(item => item.key === variant);
    if (found) return found;
  }
  return undefined;
}

/**
 * Finds a sub-account by ID, trying both the decoded and encoded versions.
 * React Router decodes URL parameters, but account IDs in the Redux store are encoded.
 * This is a specialized version for Account from @ledgerhq/types-live.
 *
 * @param account - The parent account to search in
 * @param id - The sub-account ID from URL parameters (may contain decoded slashes)
 * @param findSubAccountById - Function to find a sub-account by ID (from @ledgerhq/live-common)
 * @returns The found sub-account, or undefined if not found
 */
export function findSubAccountByIdWithFallback<
  TAccount extends { subAccounts?: TSubAccount[] },
  TSubAccount extends { id: string },
>(
  account: TAccount,
  id: string,
  findSubAccountById: (account: TAccount, id: string) => TSubAccount | undefined,
): TSubAccount | undefined {
  const variants = getAccountIdVariants(id);
  for (const variant of variants) {
    const found = findSubAccountById(account, variant);
    if (found) return found;
  }
  return undefined;
}

/**
 * Constructs a URL path for navigating to an account.
 * Handles both main accounts and token accounts (sub-accounts).
 * React Router v7 with wildcard routes (*) captures the full path including slashes.
 *
 * @param accountId - The account ID (required)
 * @param parentId - The parent account ID (optional, for token accounts)
 * @returns The URL path (e.g., "/account/{parentId}/{accountId}" or "/account/{accountId}")
 */
export function getAccountUrl(accountId: string, parentId?: string): string {
  if (parentId) {
    return `/account/${parentId}/${accountId}`;
  }
  return `/account/${accountId}`;
}
