import { BigNumber } from "bignumber.js";
import { runAssertions, allPassed } from "../core/assertions";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";

function makeAccount(
  transparentSatoshis: number,
  orchardSatoshis: number,
  saplingSatoshis: number,
  opsCount: number,
  shieldedTxCount: number,
): Partial<ZcashAccount> {
  return {
    balance: new BigNumber(transparentSatoshis),
    operationsCount: opsCount,
    privateInfo: {
      orchardBalance: new BigNumber(orchardSatoshis),
      saplingBalance: new BigNumber(saplingSatoshis),
      transactions: new Array(shieldedTxCount).fill({}),
    } as any,
  };
}

describe("runAssertions", () => {
  const account = makeAccount(
    200_000_000, // 2 ZEC transparent
    100_000_000, // 1 ZEC orchard
    50_000_000, // 0.5 ZEC sapling
    10,
    3,
  );

  it("passes correct transparent balance", () => {
    const results = runAssertions(account, { assertTransparentBalance: "2.00000000" });
    expect(results).toHaveLength(1);
    expect(results[0].pass).toBe(true);
  });

  it("fails incorrect transparent balance", () => {
    const results = runAssertions(account, { assertTransparentBalance: "1.00000000" });
    expect(results[0].pass).toBe(false);
    expect(results[0].actual).toBe("2.00000000");
    expect(results[0].expected).toBe("1.00000000");
  });

  it("passes correct shielded balance (orchard + sapling)", () => {
    const results = runAssertions(account, { assertShieldedBalance: "1.50000000" });
    expect(results[0].pass).toBe(true);
  });

  it("passes correct available balance", () => {
    const results = runAssertions(account, { assertAvailableBalance: "3.50000000" });
    expect(results[0].pass).toBe(true);
  });

  it("passes correct operations count", () => {
    const results = runAssertions(account, { assertOperationsCount: 10 });
    expect(results[0].pass).toBe(true);
  });

  it("passes correct shielded tx count", () => {
    const results = runAssertions(account, { assertShieldedTxCount: 3 });
    expect(results[0].pass).toBe(true);
  });

  it("returns empty array when no assertions requested", () => {
    expect(runAssertions(account, {})).toHaveLength(0);
  });

  it("runs multiple assertions", () => {
    const results = runAssertions(account, {
      assertTransparentBalance: "2.00000000",
      assertShieldedBalance: "1.50000000",
      assertOperationsCount: 99, // wrong
    });
    expect(results).toHaveLength(3);
    expect(results.filter(r => r.pass)).toHaveLength(2);
  });
});

describe("allPassed", () => {
  it("returns true when all pass", () => {
    expect(allPassed([{ name: "a", expected: "1", actual: "1", pass: true }])).toBe(true);
  });

  it("returns false when any fails", () => {
    expect(
      allPassed([
        { name: "a", expected: "1", actual: "1", pass: true },
        { name: "b", expected: "2", actual: "3", pass: false },
      ]),
    ).toBe(false);
  });

  it("returns true for empty array", () => {
    expect(allPassed([])).toBe(true);
  });
});
