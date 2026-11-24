import { pairMarketsWithRequestedLedgerIds } from "./pairing";

const market = (id: string, ledgerIds: string[]) => ({ id, ledgerIds, name: id });

describe("pairMarketsWithRequestedLedgerIds", () => {
  it("pairs each requested ledger id with its market, in request order", () => {
    const markets = [market("bitcoin", ["bitcoin"]), market("ethereum", ["ethereum"])];

    const pairs = pairMarketsWithRequestedLedgerIds(markets, ["ethereum", "bitcoin"]);

    expect(pairs.map(({ ledgerId, market: m }) => [ledgerId, m.id])).toEqual([
      ["ethereum", "ethereum"],
      ["bitcoin", "bitcoin"],
    ]);
  });

  it("drops ledger ids that match no market", () => {
    const pairs = pairMarketsWithRequestedLedgerIds([market("bitcoin", ["bitcoin"])], ["unknown"]);

    expect(pairs).toEqual([]);
  });

  it("keeps a requested ledger id on its own market when another row lists that id", () => {
    const shared = market("wrapped", ["ethereum"]);
    const own = market("ethereum", ["ethereum"]);

    const pairs = pairMarketsWithRequestedLedgerIds([shared, own], ["ethereum"]);

    expect(pairs[0].market).toBe(own);
  });

  it("falls back to the first market listing the ledger id when none has it as its own id", () => {
    const first = market("token-a", ["ethereum"]);
    const second = market("token-b", ["ethereum"]);

    const pairs = pairMarketsWithRequestedLedgerIds([first, second], ["ethereum"]);

    expect(pairs[0].market).toBe(first);
  });
});
