import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import {
  resolveEligibleAddressCurrencyIds,
  type ContactsAddressCurrencyDescriptor,
} from "./resolveEligibleAddressCurrencyIds";

const currencyId = (value: string) => ContactCurrencyIdSchema.parse(value);

const CURRENCY_CATALOG: readonly ContactsAddressCurrencyDescriptor[] = [
  { id: currencyId("ethereum"), networkFamily: "evm" },
  { id: currencyId("ethereum/erc20/usd-tether"), networkFamily: "evm" },
  { id: currencyId("bitcoin"), networkFamily: "bitcoin" },
  { id: currencyId("base"), networkFamily: "evm" },
  { id: currencyId("base/erc20/usd-coin"), networkFamily: "evm" },
  { id: currencyId("tron/trc20/usd-tether"), networkFamily: "tron" },
  { id: currencyId("solana"), networkFamily: "solana" },
];

describe("resolveEligibleAddressCurrencyIds", () => {
  it("resolves native and token currency ids from eligible networks", () => {
    expect(resolveEligibleAddressCurrencyIds(["evm"], CURRENCY_CATALOG)).toEqual([
      "ethereum",
      "ethereum/erc20/usd-tether",
      "base",
      "base/erc20/usd-coin",
    ]);
  });

  it("resolves future multi-family values in currency order", () => {
    expect(resolveEligibleAddressCurrencyIds(["evm", "bitcoin"], CURRENCY_CATALOG)).toEqual([
      "ethereum",
      "ethereum/erc20/usd-tether",
      "bitcoin",
      "base",
      "base/erc20/usd-coin",
    ]);
  });

  it("returns no currencies for unknown families", () => {
    expect(resolveEligibleAddressCurrencyIds(["unknown"], CURRENCY_CATALOG)).toEqual([]);
  });

  it("deduplicates currency ids while preserving their first occurrence", () => {
    expect(
      resolveEligibleAddressCurrencyIds(
        ["evm"],
        [...CURRENCY_CATALOG, { id: currencyId("ethereum"), networkFamily: "evm" }],
      ),
    ).toEqual(["ethereum", "ethereum/erc20/usd-tether", "base", "base/erc20/usd-coin"]);
  });
});
