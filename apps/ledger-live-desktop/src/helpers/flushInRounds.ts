/** Writes that keep coming must not hold the quit. */
const MAX_FLUSH_ROUNDS = 5;

/**
 * Run `flushRound` again while it reports new writes.
 */
export async function flushInRounds(flushRound: () => Promise<boolean>): Promise<void> {
  for (let round = 0; round < MAX_FLUSH_ROUNDS; round++) {
    const newWritesCame = await flushRound();
    if (!newWritesCame) return;
  }
}
