export function assertValidBlockHeight(height: number): void {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`Invalid block height: ${height}`);
  }
}
