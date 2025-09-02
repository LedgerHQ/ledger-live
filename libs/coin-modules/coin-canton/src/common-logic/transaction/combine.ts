// Combines signature with raw transaction
export function combine(transaction: string, signature: string): string {
  const tx = JSON.parse(transaction);

  return JSON.stringify({
    ...tx,
    signature,
  });
}
