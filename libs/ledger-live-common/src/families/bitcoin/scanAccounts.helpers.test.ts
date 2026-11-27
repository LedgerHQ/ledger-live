import BigNumber from "bignumber.js";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import type { BitcoinAccount } from "@ledgerhq/coin-bitcoin/types";
import { fundedBitcoinAccounts, richestAccount } from "./fixtures/scanAccounts.helpers";

const accountWithBalance = (id: string, balance: number): BitcoinAccount => ({
  ...createFixtureAccount(),
  id,
  spendableBalance: new BigNumber(balance),
});

describe("scan accounts helpers", () => {
  const poor = accountWithBalance("poor", 10);
  const rich = accountWithBalance("rich", 5_000);
  const middle = accountWithBalance("middle", 300);

  it("picks the account with the highest spendable balance wherever it is", () => {
    expect([
      richestAccount([rich, poor, middle]).id,
      richestAccount([poor, rich, middle]).id,
      richestAccount([poor, middle, rich]).id,
    ]).toEqual(["rich", "rich", "rich"]);
  });

  it("picks the only account of a single account list", () => {
    expect(richestAccount([poor])).toBe(poor);
  });

  it("refuses to pick the richest of no account", () => {
    expect(() => richestAccount([])).toThrow("no account to pick the richest from");
  });

  it("keeps the accounts that hold more than the minimum balance", () => {
    expect(fundedBitcoinAccounts([poor, rich, middle], "bitcoin", 100).map(({ id }) => id)).toEqual(
      ["rich", "middle"],
    );
  });

  it("reports the currency when no account holds more than the minimum balance", () => {
    expect(() => fundedBitcoinAccounts([poor], "litecoin", 100)).toThrow(
      "no litecoin account holds more than 100 satoshis",
    );
  });
});
