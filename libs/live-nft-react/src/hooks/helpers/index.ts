export function hashProtoNFT(contract: string, tokenId: string, currencyId: string): string {
  return `${contract}|${tokenId}|${currencyId}`;
}

export function isThresholdValid(threshold?: string | number): boolean {
  return Number(threshold) >= 0 && Number(threshold) <= 100;
}
