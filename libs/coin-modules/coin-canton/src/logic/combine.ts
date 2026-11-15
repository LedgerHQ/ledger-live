// Combines signature with raw transaction
export function combine(serialized: string, signature: string[]): string {
  if (signature.length !== 1) {
    throw new Error(`Canton combine expects exactly one signature, got ${signature.length}`);
  }
  return JSON.stringify({
    serialized,
    signature: signature[0],
  });
}
