// Bounded-concurrency Promise.all. Ported from @ledgerhq/live-promise, which this package cannot
// depend on. Countervalues is its only new-architecture consumer; extract to a shared package when
// a second one appears.

/**
 * `promiseAllBatched(n, items, i => f(i))` is `Promise.all(items.map(i => f(i)))` with a guarantee
 * that no more than `n` calls to `f` are in flight at once. Results keep the input order.
 */
export async function promiseAllBatched<A, B>(
  batch: number,
  items: Array<A>,
  fn: (arg0: A, arg1: number) => Promise<B>,
): Promise<B[]> {
  const data = new Array(items.length);
  const queue = items.map((item, index) => ({
    item,
    index,
  }));

  async function step() {
    if (queue.length === 0) return;
    const first = queue.shift();
    if (first) {
      const { item, index } = first;
      data[index] = await fn(item, index);
    }
    await step(); // each time an item redeem, we schedule another one
  }

  // initially, we schedule <batch> items in parallel
  await Promise.all(new Array(Math.min(batch, items.length)).fill(() => undefined).map(step));
  return data;
}
