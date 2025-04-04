import { DEFAULT_THRESHOLD } from "./const";

export function hashProtoNFT(
  contract: string,
  currencyId: string,
  tokenId?: string | null,
): string {
  return `${contract}|${tokenId ?? 0}|${currencyId}`;
}

export function isThresholdValid(threshold?: string | number): boolean {
  return Number(threshold) >= 0 && Number(threshold) <= 100;
}

export function decodeCollectionId(collectionId: string) {
  const [accountId, contractAddress] = collectionId.split("|");
  return { accountId, contractAddress };
}

export function getThreshold(threshold?: string | number): number {
  return isThresholdValid(threshold) ? Number(threshold) : DEFAULT_THRESHOLD;
}
