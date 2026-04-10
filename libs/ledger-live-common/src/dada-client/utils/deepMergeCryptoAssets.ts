import type { CryptoAssetMeta } from "../entities";

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
