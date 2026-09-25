/** Runs `fn`, logging its elapsed time under `label` on both the success and the failure path. */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.log(`[aleo coin-tester] ${label}: ${Date.now() - start}ms`);
  }
}
