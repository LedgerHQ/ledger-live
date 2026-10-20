import { boundByTransaction } from "./boundByTransaction";

const op = (hash: string) => ({ hash });

describe("boundByTransaction", () => {
  it("returns the list untouched when there is no bound, or the list already fits", () => {
    const operations = [op("h1"), op("h2")];

    expect(boundByTransaction(operations, undefined)).toBe(operations);
    expect(boundByTransaction(operations, 2)).toBe(operations);
    expect(boundByTransaction(operations, 5)).toBe(operations);
  });

  it("keeps the newest operations, since the next sync's watermark derives from the head", () => {
    expect(boundByTransaction([op("h1"), op("h2"), op("h3")], 2)).toEqual([op("h1"), op("h2")]);
  });

  it("overshoots the bound rather than splitting the transaction that crosses it", () => {
    // Two rows of h2 straddle the bound: keeping only the first would persist half a transaction,
    // and the parent watermark never goes back below the cut to refetch the other half.
    expect(boundByTransaction([op("h1"), op("h2"), op("h2")], 2)).toEqual([
      op("h1"),
      op("h2"),
      op("h2"),
    ]);
  });

  it("finds a sibling that is not adjacent to the row that crossed the bound", () => {
    // `mergeOps` orders newest-first and nothing more, and every operation in a block carries that
    // block's date, so two transactions in the same block can interleave. Walking neighbours would
    // miss the h1 row sitting one past h2's.
    expect(boundByTransaction([op("h1"), op("h2"), op("h1")], 2)).toEqual([
      op("h1"),
      op("h2"),
      op("h1"),
    ]);
  });

  it("keeps the rows between a transaction and its furthest sibling, so the window stays contiguous", () => {
    // Filtering the admitted hashes instead of extending the cut would return [h1, h2, h1] and
    // drop h3 -- which is newer than the h1 row it kept, leaving a hole above the oldest retained
    // operation that the next watermark never refetches.
    expect(boundByTransaction([op("h1"), op("h2"), op("h3"), op("h1")], 2)).toEqual([
      op("h1"),
      op("h2"),
      op("h3"),
      op("h1"),
    ]);
  });

  it("extends the cut again for a transaction the first extension pulled in", () => {
    // h1's furthest row is index 3, so the cut moves there and admits h3 at index 2; h3's own
    // furthest row is index 4, which pushes the cut once more. A single pass would stop short.
    expect(boundByTransaction([op("h1"), op("h2"), op("h3"), op("h1"), op("h3")], 2)).toEqual([
      op("h1"),
      op("h2"),
      op("h3"),
      op("h1"),
      op("h3"),
    ]);
  });

  it("drops a transaction that begins past the cut even when the cut was extended", () => {
    // The extension to h1's furthest row (index 2) admits nothing new, so h3 stays below the cut
    // and is truncated from the tail rather than leaving a hole.
    expect(boundByTransaction([op("h1"), op("h2"), op("h1"), op("h3"), op("h3")], 2)).toEqual([
      op("h1"),
      op("h2"),
      op("h1"),
    ]);
  });

  it("never admits a transaction that starts past the bound, so the result stays contiguous", () => {
    // h3 is entirely below the cut: admitting it would leave a hole above the oldest retained
    // operation, which no later sync refetches -- worse than a short history.
    expect(boundByTransaction([op("h1"), op("h2"), op("h3"), op("h3")], 2)).toEqual([
      op("h1"),
      op("h2"),
    ]);
  });

  it("treats a falsy hash as its own group", () => {
    // Grouping them together would make one giant group and retain everything.
    expect(boundByTransaction([op(""), op(""), op("")], 2)).toEqual([op(""), op("")]);
  });
});
