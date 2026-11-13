/**
 * Runs `fn` with only the SIGINT listeners it adds, so a `process.emit("SIGINT")` reaches the CLI
 * run as Ctrl+C would, and no other file's listener (e.g. one that exits the process).
 */
export async function withOwnSigint<T>(fn: () => Promise<T>): Promise<T> {
  const otherListeners = process.listeners("SIGINT");
  process.removeAllListeners("SIGINT");
  try {
    return await fn();
  } finally {
    process.removeAllListeners("SIGINT");
    for (const listener of otherListeners) process.on("SIGINT", listener);
  }
}
