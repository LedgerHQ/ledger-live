import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import { findMigrationAccount } from "./migration";

const hypercoreAt = (id: string, freshAddress: string) => ({
  ...createFixtureAccount(id, getCryptoCurrencyById("hypercore")),
  freshAddress,
});

describe("findMigrationAccount", () => {
  const legacyAccount = createFixtureAccount("arb", getCryptoCurrencyById("arbitrum"));

  it("finds the Hyperliquid account at the legacy address", () => {
    const match = hypercoreAt("hc", legacyAccount.freshAddress.toLowerCase());

    expect(
      findMigrationAccount([legacyAccount, hypercoreAt("other", "0x02"), match], legacyAccount),
    ).toBe(match);
  });

  it("ignores accounts of other currencies at the legacy address", () => {
    expect(findMigrationAccount([legacyAccount], legacyAccount)).toBeUndefined();
  });

  it("ignores Hyperliquid accounts at another address", () => {
    expect(findMigrationAccount([hypercoreAt("other", "0x02")], legacyAccount)).toBeUndefined();
  });
});
