export function computeIntentType(transaction: Record<string, unknown>): string {
  if (typeof transaction.mode !== "string") {
    throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
  }

  if (["send-legacy", "send-eip1559"].includes(transaction.mode)) {
    return transaction.mode;
  }

  if (transaction.mode === "send") {
    return transaction.type === 2 ? "send-eip1559" : "send-legacy";
  }

  throw new Error(`Unsupported transaction mode: '${transaction.mode}'`);
}
