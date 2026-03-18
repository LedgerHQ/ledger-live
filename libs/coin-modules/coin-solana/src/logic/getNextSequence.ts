export function getNextSequence(_address: string): bigint {
  return BigInt(Date.now());
}
