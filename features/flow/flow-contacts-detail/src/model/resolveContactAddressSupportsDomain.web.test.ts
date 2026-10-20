import { ContactCurrencyIdSchema } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import { resolveContactAddressSupportsDomain } from "./resolveContactAddressSupportsDomain";

const supportsDomain = jest.fn((network: CryptoCurrency) => network.family === "evm");

describe("resolveContactAddressSupportsDomain", () => {
  it.each([
    ["an EVM network", "ethereum", true],
    ["an EVM token", "ethereum/erc20/usd__coin", true],
    ["a non-EVM network", "bitcoin", false],
    ["a non-EVM token", "solana/spl/usdc", false],
    ["an unknown currency", "unknown-currency", false],
  ])("should resolve domain support for %s", (_, currencyId, expected) => {
    expect(
      resolveContactAddressSupportsDomain(
        ContactCurrencyIdSchema.parse(currencyId),
        supportsDomain,
      ),
    ).toBe(expected);
  });

  it("should not support domains without a currency", () => {
    expect(resolveContactAddressSupportsDomain(undefined, supportsDomain)).toBe(false);
  });

  it("should check domain support against the parent network of a token", () => {
    resolveContactAddressSupportsDomain(
      ContactCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
      supportsDomain,
    );

    expect(supportsDomain).toHaveBeenLastCalledWith(expect.objectContaining({ id: "ethereum" }));
  });
});
