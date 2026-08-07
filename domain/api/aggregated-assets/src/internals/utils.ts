import type { CryptoAssetMeta } from "@domain/entity-aggregated-asset";
import type { AssetsData } from "../types";

type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason: unknown };

/**
 * Local `Promise.allSettled`, so a failed chunk does not reject the whole batch.
 *
 * Internal: the chunked lookup endpoint's partial-result tolerance depends on it.
 */
export function allSettled<T>(promises: Promise<T>[]): Promise<SettledResult<T>[]> {
  return Promise.all(
    promises.map(p =>
      p
        .then(value => ({ status: "fulfilled" as const, value }))
        .catch(reason => ({ status: "rejected" as const, reason })),
    ),
  );
}

const ALLOWED_DADA_HOSTS = new Set(["dada.api.ledger.com", "dada.api.ledger-test.com"]);

/** Guards endpoints that issue their own `fetch` against a mis-resolved base url. */
export function assertDadaApiUrl(url: URL): void {
  if (!ALLOWED_DADA_HOSTS.has(url.hostname)) {
    throw new Error(`Blocked request to untrusted host: ${url.hostname}`);
  }
}

export type CurrencyIdChunks = string[][];

const DEFAULT_CHUNK_SIZE = 25;

export function chunkCurrencyIds(
  ids: string[],
  size: number = DEFAULT_CHUNK_SIZE,
): CurrencyIdChunks {
  if (!Number.isFinite(size) || size <= 0) {
    throw new RangeError(`chunkCurrencyIds: size must be a positive finite number, got ${size}`);
  }

  const chunks: CurrencyIdChunks = [];

  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }

  return chunks;
}

/**
 * Deep-merges two `cryptoAssets` maps so that `assetsIds` entries
 * from different pages/chunks are accumulated instead of overwritten.
 */
export function deepMergeCryptoAssets(
  target: Record<string, CryptoAssetMeta>,
  source: Record<string, CryptoAssetMeta>,
): void {
  for (const [metaId, meta] of Object.entries(source)) {
    if (target[metaId]) {
      Object.assign(target[metaId].assetsIds, meta.assetsIds);
    } else {
      target[metaId] = { ...meta, assetsIds: { ...meta.assetsIds } };
    }
  }
}

/** The zero value of an aggregated-assets response: every collection present but empty. */
export function emptyAssetsData(): AssetsData {
  return {
    cryptoAssets: {},
    networks: {},
    cryptoOrTokenCurrencies: {},
    interestRates: {},
    markets: {},
    currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
  };
}
