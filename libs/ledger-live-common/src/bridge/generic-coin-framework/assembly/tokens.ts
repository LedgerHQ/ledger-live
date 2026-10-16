import type { AssetInfo, Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account } from "@ledgerhq/types-live";
import chunk from "lodash/chunk";
import type { OperationCommon } from "../types";

/**
 * A zero balance for each token the account holds that the fresh balance list no longer reports.
 *
 * A token account fully swept to zero can disappear from the balance list (some chains only list
 * non-zero holdings) rather than be reported with a 0 value. `buildSubAccounts` only processes the
 * tokens of that list, so without this a vanished token would never be processed again, freezing its
 * sub-account at its pre-sweep state. Not gated on a non-empty list: a wallet whose only token got
 * swept legitimately reports no token at all, and that sweep must still zero the sub-account.
 *
 * References compare lower-cased: a chain's balance listing and its `getAssetFromToken` do not always
 * agree on casing (Stacks lower-cases the listing), and a case-sensitive match would add a zero
 * duplicate of a token still held.
 */
export function vanishedTokenBalances(
  initialAccount: Account | undefined,
  tokenBalances: Balance[],
  getAssetFromToken: BridgeApi["getAssetFromToken"],
  address: string,
): Balance[] {
  if (!getAssetFromToken) return [];
  const freshReferences = new Set(
    tokenBalances
      .map(b => ("assetReference" in b.asset ? b.asset.assetReference : undefined))
      .filter((ref): ref is string => !!ref)
      .map(ref => ref.toLowerCase()),
  );
  return (initialAccount?.subAccounts ?? []).flatMap(subAccount => {
    // A throwing family implementation must not fail the whole sync over one sub-account.
    let asset: ReturnType<typeof getAssetFromToken>;
    try {
      asset = getAssetFromToken(subAccount.token, address);
    } catch {
      return [];
    }
    if (
      !asset ||
      !("assetReference" in asset) ||
      !asset.assetReference ||
      freshReferences.has(asset.assetReference.toLowerCase())
    ) {
      return [];
    }
    return [{ value: 0n, asset }];
  });
}

const TOKEN_MANAGEMENT_TYPES: ReadonlySet<string> = new Set(["OPT_IN", "OPT_OUT"]);

/** The operations of a token (reference and owner), its opt-in and opt-out left to the parent. */
export function assetOperations(operations: OperationCommon[]): OperationCommon[] {
  return operations.filter(
    operation =>
      operation?.extra?.assetReference &&
      operation?.extra?.assetOwner &&
      !TOKEN_MANAGEMENT_TYPES.has(operation.type),
  );
}

const TOKEN_LOOKUP_BATCH_SIZE = 50;

// Lower-cased, like every other asset reference comparison here: a chain's balance response and
// its own derivations aren't guaranteed to agree on casing.
function lowercasedReference(asset: AssetInfo): string | undefined {
  return "assetReference" in asset && asset.assetReference
    ? asset.assetReference.toLowerCase()
    : undefined;
}

/**
 * The assets of walked token transfers that have no entry in `balances`, as the family would list
 * them in `knownAssets`. Only a token the family resolves and the user has not blacklisted
 * qualifies: `buildSubAccounts` drops any other one regardless, and an unlisted (spam) transfer
 * would otherwise cost a balance read on every sync it appears in.
 *
 * A lookup that fails is not an unlisted token, and is left to fail the sync: swallowed, the
 * token would be skipped while this sync still advances the watermark past its transfer, and no
 * later sync would look for it again. Failed, the sync is retried from the same watermark.
 */
async function unbalancedTokenAssets(
  operations: OperationCommon[],
  balances: Balance[],
  {
    getTokenFromAsset,
    getAssetFromToken,
  }: Pick<BridgeApi, "getTokenFromAsset" | "getAssetFromToken">,
  address: string,
  blacklistedTokenIds: string[],
): Promise<AssetInfo[]> {
  if (!getTokenFromAsset || !getAssetFromToken) return [];

  const balanced = new Set(balances.map(b => lowercasedReference(b.asset)));
  const unbalanced = new Map<string, OperationCommon>();
  for (const op of operations) {
    const reference = String(op.extra.assetReference).toLowerCase();
    if (!balanced.has(reference) && !unbalanced.has(reference)) unbalanced.set(reference, op);
  }

  const resolve = async (op: OperationCommon) => {
    // `"token"` when the precise type is unknown, as when building a transaction intent.
    const token = await getTokenFromAsset({
      type: "token",
      assetReference: String(op.extra.assetReference),
      assetOwner: String(op.extra.assetOwner),
    });
    return token && !blacklistedTokenIds.includes(token.id)
      ? getAssetFromToken(token, address)
      : undefined;
  };
  // In batches: a walk of a spam-heavy address can carry thousands of distinct unlisted
  // references, each a crypto-assets store lookup.
  const assets: (AssetInfo | undefined)[] = [];
  for (const batch of chunk([...unbalanced.values()], TOKEN_LOOKUP_BATCH_SIZE)) {
    assets.push(...(await Promise.all(batch.map(resolve))));
  }
  return assets.filter((asset): asset is AssetInfo => asset !== undefined);
}

/** Reads the balances again with `assets` added to the ones the account already holds. */
export type TokenBalancesRead = (assets: AssetInfo[]) => Promise<Balance[]>;

/**
 * The balances of the tokens this sync's walk found without a balance entry, read again by `read`.
 *
 * The balance read runs before the walk, so it only looked for tokens up to that moment. A token
 * first received in between reaches the walked operations with no balance entry: `buildSubAccounts`
 * would not create its sub-account, and the next sync -- resuming its scan past that transfer --
 * would not find it either. That holds after an unscoped read too: the next sync scopes its scan to
 * the sub-accounts this one stores. Such a token is read once more, keeping only its entry.
 */
export async function lateTokenBalances(
  operations: OperationCommon[],
  balances: Balance[],
  bridgeApi: Pick<BridgeApi, "getTokenFromAsset" | "getAssetFromToken">,
  address: string,
  blacklistedTokenIds: string[],
  read: TokenBalancesRead,
): Promise<Balance[]> {
  const lateAssets = await unbalancedTokenAssets(
    operations,
    balances,
    bridgeApi,
    address,
    blacklistedTokenIds,
  );
  if (!lateAssets.length) return [];
  const lateReferences = new Set(lateAssets.map(lowercasedReference));
  return (await read(lateAssets)).filter(b => lateReferences.has(lowercasedReference(b.asset)));
}
