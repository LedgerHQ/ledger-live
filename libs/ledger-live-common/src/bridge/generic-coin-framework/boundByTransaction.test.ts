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
