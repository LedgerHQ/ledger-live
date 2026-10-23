/**
 * The Portfolio service names a token it has no CAL entry for by its contract address
 * (`erc20.0x…`), with no ledger id, no ticker and no decimals. The wallet can find that token in
 * CAL from its network and contract address; this completes such assets with what CAL answers.
 */

export interface AssetLike {
  readonly network: string;
  readonly asset: string;
  readonly calId?: string;
}

export interface TokenInfo {
  readonly calId: string;
  readonly ticker: string;
  readonly name: string;
  readonly decimals: number;
}

export type TokenLookup = (network: string, address: string) => Promise<TokenInfo | undefined>;

export interface FetchTokensOptions {
  /** Distinct tokens looked up at most, so a portfolio full of dust does not flood CAL. */
  readonly maxLookups?: number;
  readonly concurrency?: number;
}

const CONTRACT_ASSET = /^erc20\.(0x[0-9a-fA-F]{40})$/;

/** The key of a token CAL should be asked about; undefined when the asset needs no lookup. */
export function tokenKey(asset: AssetLike): string | undefined {
  if (asset.calId) return undefined;
  const match = CONTRACT_ASSET.exec(asset.asset);
  return match ? `${asset.network}:${match[1].toLowerCase()}` : undefined;
}

/** Asks CAL about every distinct unknown token, a few at a time. A failed lookup is skipped. */
export async function fetchTokens(
  assets: readonly AssetLike[],
  lookup: TokenLookup,
  { maxLookups = 60, concurrency = 6 }: FetchTokensOptions = {},
): Promise<ReadonlyMap<string, TokenInfo>> {
  const keys = [...new Set(assets.map(tokenKey))]
    .filter((key): key is string => key !== undefined)
    .slice(0, maxLookups);

  const found = new Map<string, TokenInfo>();
  let next = 0;
  const worker = async () => {
    while (next < keys.length) {
      const key = keys[next++];
      const separator = key.indexOf(":");
      try {
        const token = await lookup(key.slice(0, separator), key.slice(separator + 1));
        if (token) found.set(key, token);
      } catch {
        // CAL does not know it, or could not be reached: the asset stays as the service sent it.
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, keys.length) }, worker));
  return found;
}

/** The asset completed with its token, or unchanged when none was found. */
export function applyTokens<
  T extends AssetLike & { ticker?: string; name?: string; decimals?: number },
>(asset: T, tokens: ReadonlyMap<string, TokenInfo>): T {
  const key = tokenKey(asset);
  const token = key ? tokens.get(key) : undefined;
  return token
    ? {
        ...asset,
        calId: token.calId,
        ticker: token.ticker,
        name: token.name,
        decimals: token.decimals,
      }
    : asset;
}
