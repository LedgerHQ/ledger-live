/** Tracks DMK/native USB work where SIGINT should skip graceful USB teardown. */
let activeScopes = 0;

export function hasWalletCliDeviceInterruptScope(): boolean {
  return activeScopes > 0;
}

export async function withWalletCliDeviceInterruptScope<T>(fn: () => Promise<T>): Promise<T> {
  activeScopes++;
  try {
    return await fn();
  } finally {
    activeScopes--;
  }
}
