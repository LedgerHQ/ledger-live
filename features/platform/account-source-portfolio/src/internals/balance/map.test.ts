import { ETH, entry } from "../fakeService.mock";
import { toAccountBalances } from "./map";

describe("toAccountBalances", () => {
  it("keeps the pending unlocked part next to a confirmed locked one", () => {
    const { rows } = toAccountBalances(ETH, [
      entry(ETH, { amount: "3", locked: true }),
      entry(ETH, { amount: "7", status: "pending" }),
    ]);

    expect(rows).toEqual([{ assetId: "ethereum", balance: "10", spendableBalance: "7" }]);
  });

  it("keeps the pending locked part next to a confirmed unlocked one", () => {
    const { rows } = toAccountBalances(ETH, [
      entry(ETH, { amount: "7" }),
      entry(ETH, { amount: "3", locked: true, status: "pending" }),
    ]);

    expect(rows).toEqual([{ assetId: "ethereum", balance: "10", spendableBalance: "7" }]);
  });

  it("prefers the confirmed entries of a part over its pending ones", () => {
    const { rows } = toAccountBalances(ETH, [
      entry(ETH, { amount: "7" }),
      entry(ETH, { amount: "100", status: "pending" }),
    ]);

    expect(rows).toEqual([{ assetId: "ethereum", balance: "7", spendableBalance: "7" }]);
  });
});
