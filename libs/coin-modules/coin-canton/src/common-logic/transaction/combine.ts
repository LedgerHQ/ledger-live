// Combines signature with raw transaction
export function combine(serialized: string, signature: string): string {
  return JSON.stringify({
    serialized,
    signature,
  });
}
